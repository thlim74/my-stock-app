import { createClient } from "@supabase/supabase-js";

const TOKEN_PATH = "/oauth2/tokenP";
const INVESTOR_TIME_PATH = "/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market";

const MARKET_CODES = {
  KOSPI: { market: "999", sector: "S001" },
  KOSDAQ: { market: "999", sector: "S101" },
};

let accessToken = null;
let tokenExpiresAt = 0;

const toNumber = (value) => {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
};

const getKisConfig = () => {
  const baseUrl = process.env.KIS_BASE_URL?.trim().replace(/\/$/, "");
  const appKey = process.env.KIS_APP_KEY?.trim();
  const appSecret = process.env.KIS_APP_SECRET?.trim();

  if (!baseUrl || !appKey || !appSecret) {
    throw new Error("한국투자증권 API 환경변수가 설정되지 않았습니다.");
  }

  return { baseUrl, appKey, appSecret };
};

const getTokenStore = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("한투 토큰 공유를 위해 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  }

  return {
    host: new URL(url).host,
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
};

const getStoredToken = async (store, host) => {
  const validAfter = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data, error } = await store
    .from("kis_access_tokens")
    .select("access_token, expires_at")
    .eq("provider", "KIS")
    .gt("expires_at", validAfter)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      throw new Error(`한투 토큰 테이블이 ${host}에 없습니다.`);
    }
    throw new Error(`한투 토큰 저장소 접근 실패: ${error.message}`);
  }
  if (!data?.access_token) return null;

  return {
    token: data.access_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
};

const getAccessToken = async (config) => {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const { client: store, host } = getTokenStore();
  const stored = await getStoredToken(store, host);
  if (stored) {
    accessToken = stored.token;
    tokenExpiresAt = stored.expiresAt;
    return accessToken;
  }

  const response = await fetch(`${config.baseUrl}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: config.appKey,
      appsecret: config.appSecret,
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || "한국투자증권 인증 토큰 발급에 실패했습니다.");
  }

  accessToken = payload.access_token;
  tokenExpiresAt = Date.now() + Math.max((Number(payload.expires_in) || 86400) - 300, 60) * 1000;
  const { error } = await store.from("kis_access_tokens").upsert({
    provider: "KIS",
    access_token: accessToken,
    expires_at: new Date(tokenExpiresAt).toISOString(),
  });
  if (error) {
    throw new Error("한투 토큰을 안전하게 저장하지 못했습니다.");
  }
  return accessToken;
};

const amountSummary = (output, prefix) => ({
  sell: toNumber(output?.[`${prefix}_seln_tr_pbmn`]),
  buy: toNumber(output?.[`${prefix}_shnu_tr_pbmn`]),
  net: toNumber(output?.[`${prefix}_ntby_tr_pbmn`]),
});

export const fetchKisMarketInvestorTime = async (market) => {
  const code = MARKET_CODES[market];
  if (!code) throw new Error("지원하지 않는 시장입니다.");

  const config = getKisConfig();
  const token = await getAccessToken(config);
  const params = new URLSearchParams({
    FID_INPUT_ISCD: code.market,
    FID_INPUT_ISCD_2: code.sector,
  });
  const response = await fetch(`${config.baseUrl}${INVESTOR_TIME_PATH}?${params}`, {
    headers: {
      authorization: `Bearer ${token}`,
      appkey: config.appKey,
      appsecret: config.appSecret,
      tr_id: "FHPTJ04030000",
      custtype: "P",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.rt_cd !== "0") {
    throw new Error(payload?.msg1 || "한국투자증권 시장 수급 조회에 실패했습니다.");
  }

  const output = Array.isArray(payload?.output) ? payload.output[0] : payload?.output || {};
  const netValues = {
    foreign: toNumber(output?.frgn_ntby_tr_pbmn),
    individual: toNumber(output?.prsn_ntby_tr_pbmn),
    institution: toNumber(output?.orgn_ntby_tr_pbmn),
    securities: toNumber(output?.scrt_ntby_tr_pbmn),
    investmentTrust: toNumber(output?.ivtr_ntby_tr_pbmn),
    privateFund: toNumber(output?.pe_fund_ntby_tr_pbmn),
    bank: toNumber(output?.bank_ntby_tr_pbmn),
    insurance: toNumber(output?.insu_ntby_tr_pbmn),
    finance: toNumber(output?.mrbn_ntby_tr_pbmn),
    pension: toNumber(output?.fund_ntby_tr_pbmn),
    otherInstitution: toNumber(output?.etc_orgt_ntby_tr_pbmn),
    otherCorporation: toNumber(output?.etc_corp_ntby_tr_pbmn),
  };
  return {
    market,
    fetchedAt: new Date().toISOString(),
    netValues,
    summary: {
      foreign: amountSummary(output, "frgn"),
      individual: amountSummary(output, "prsn"),
      institution: amountSummary(output, "orgn"),
    },
    institutionDetails: {
      securities: amountSummary(output, "scrt"),
      investmentTrust: amountSummary(output, "ivtr"),
      privateFund: amountSummary(output, "pe_fund"),
      bank: amountSummary(output, "bank"),
      insurance: amountSummary(output, "insu"),
      finance: amountSummary(output, "mrbn"),
      pension: amountSummary(output, "fund"),
      otherInstitution: amountSummary(output, "etc_orgt"),
      otherCorporation: amountSummary(output, "etc_corp"),
    },
  };
};
