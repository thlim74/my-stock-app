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
  const baseUrl = process.env.KIS_BASE_URL?.replace(/\/$/, "");
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  if (!baseUrl || !appKey || !appSecret) {
    throw new Error("한국투자증권 API 환경변수가 설정되지 않았습니다.");
  }

  return { baseUrl, appKey, appSecret };
};

const getAccessToken = async (config) => {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

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

  const output = payload?.output || {};
  return {
    market,
    fetchedAt: new Date().toISOString(),
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
