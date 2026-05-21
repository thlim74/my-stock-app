import { createClient } from "@supabase/supabase-js";

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Referer: "https://finance.naver.com/",
};

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, anonKey);
};

const isForeignTicker = (market, code) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  market === "AMEX" ||
  (code && (code.includes(":") || /^[A-Z]+$/.test(code)));

const buildTickerCandidates = (code, market) => {
  const raw = String(code || "").trim();
  const dotNormalized = raw.split(".")[0];
  const colonNormalized = raw.includes(":") ? raw.split(":").pop() : raw;
  const isForeign = isForeignTicker(market, raw);

  const candidates = isForeign
    ? [raw, colonNormalized, dotNormalized]
    : [dotNormalized, raw];

  return [...new Set(candidates.filter(Boolean))];
};

const getPartsInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

const getTradingWindow = (market, code) => {
  if (isForeignTicker(market, code)) {
    return {
      label: "US",
      timeZone: "America/New_York",
      closeHour: 16,
      closeMinute: 10,
    };
  }

  return {
    label: "KR",
    timeZone: "Asia/Seoul",
    closeHour: 15,
    closeMinute: 40,
  };
};

const isMarketClosed = (market, code, now = new Date()) => {
  const window = getTradingWindow(market, code);
  const parts = getPartsInTimeZone(now, window.timeZone);
  const weekday = parts.weekday;

  if (weekday === "Sat" || weekday === "Sun") {
    return {
      closed: false,
      reason: "Weekend",
      tradingDate: `${parts.year}-${parts.month}-${parts.day}`,
    };
  }

  const minutesNow = Number(parts.hour) * 60 + Number(parts.minute);
  const closeMinutes = window.closeHour * 60 + window.closeMinute;

  return {
    closed: minutesNow >= closeMinutes,
    reason:
      minutesNow >= closeMinutes
        ? null
        : `${window.label} market has not closed yet`,
    tradingDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
};

const tryFetchNaverPrice = async (code, market) => {
  const candidates = buildTickerCandidates(code, market);

  for (const candidate of candidates) {
    const response = await fetch(
      `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${candidate}`,
      {
        headers: COMMON_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const price = data?.result?.areas?.[0]?.datas?.[0]?.nv;

    if (price !== undefined && price !== null) {
      return { price, sourceCode: candidate };
    }
  }

  return null;
};

const inferMarketFromTicker = (ticker) =>
  ticker && (ticker.includes(":") || /^[A-Z]+$/.test(ticker)) ? "NASDAQ" : "KOSPI";

const deriveTargetsFromTransactions = (transactions = [], stockMaster = []) => {
  const targets = new Map();
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.날짜) - new Date(b.날짜),
  );

  sorted.forEach((tx) => {
    if (tx.구분 !== "매수") {
      return;
    }

    const ticker = tx.티커?.trim();
    const name = tx.종목명?.trim();
    const date = tx.날짜;

    if (!ticker || !date) {
      return;
    }

    const masterMatch = stockMaster.find(
      (stock) => stock.티커 === ticker || stock.종목명 === name,
    );

    const existing = targets.get(ticker);
    const market = masterMatch?.시장 || inferMarketFromTicker(ticker);

    if (!existing || date < existing.startDate) {
      targets.set(ticker, {
        code: ticker,
        name: name || masterMatch?.종목명 || ticker,
        market,
        startDate: date,
      });
    }
  });

  return [...targets.values()];
};

const ensureAssetsExist = async (supabase, targets = []) => {
  if (targets.length === 0) {
    return;
  }

  const assetRows = targets.map((target) => ({
    code: target.code,
    name: target.name || target.code,
    market: target.market || inferMarketFromTicker(target.code),
    quantity: 0,
  }));

  const { error } = await supabase.from("assets").upsert(assetRows);

  if (error) {
    throw new Error(`Failed to ensure assets: ${error.message}`);
  }
};

const normalizeDate = (value) => value.replace(/\./g, "-");

const extractDomesticRows = (html) => {
  const rows = [];
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

  trMatches.forEach((tr) => {
    const dateMatch = tr.match(/gray03">([0-9]{4}\.[0-9]{2}\.[0-9]{2})<\/span>/);
    if (!dateMatch) {
      return;
    }

    const nums = [
      ...tr.matchAll(
        /<td class="num">\s*(?:<span[^>]*>)?\s*([\d,]+)\s*(?:<\/span>)?\s*<\/td>/g,
      ),
    ].map((match) => Number(match[1].replace(/,/g, "")));

    if (nums.length === 0) {
      return;
    }

    rows.push({
      date: normalizeDate(dateMatch[1]),
      price: nums[0],
    });
  });

  return rows;
};

const fetchDomesticHistory = async (code, startDate) => {
  const rows = [];

  for (let page = 1; page <= 200; page += 1) {
    const response = await fetch(
      `https://finance.naver.com/item/sise_day.naver?code=${encodeURIComponent(code)}&page=${page}`,
      {
        headers: COMMON_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      break;
    }

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder("euc-kr").decode(buffer);
    const pageRows = extractDomesticRows(html);

    if (pageRows.length === 0) {
      break;
    }

    rows.push(
      ...pageRows
        .filter((row) => row.date >= startDate)
        .map((row) => ({
          code,
          date: row.date,
          price: row.price,
        })),
    );

    const oldestRow = pageRows[pageRows.length - 1];
    if (!oldestRow || oldestRow.date < startDate) {
      break;
    }
  }

  const deduped = new Map();
  rows.forEach((row) => {
    deduped.set(`${row.code}:${row.date}`, row);
  });

  return [...deduped.values()];
};

const loadActiveAssets = async (supabase) => {
  const { data: holdings, error: holdingsError } = await supabase
    .from("assets")
    .select("code, market, name")
    .gt("quantity", 0);

  if (holdingsError) {
    const missingAssetsTable =
      holdingsError.message?.includes("Could not find the table") &&
      holdingsError.message?.includes("assets");

    if (missingAssetsTable) {
      return { holdings: null, missingTable: true };
    }

    throw new Error(`Failed to load holdings: ${holdingsError.message}`);
  }

  return { holdings: (holdings || []).filter((holding) => holding.code), missingTable: false };
};

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { holdings, missingTable } = await loadActiveAssets(supabase);

    if (missingTable) {
      return Response.json({
        success: true,
        updated: 0,
        message: "assets 테이블이 없어 일별 종가 수집을 건너뜁니다.",
      });
    }

    if (!holdings || holdings.length === 0) {
      return Response.json({ success: true, updated: 0, message: "No holdings" });
    }

    const results = [];
    const skipped = [];

    for (const holding of holdings) {
      const marketStatus = isMarketClosed(holding.market, holding.code);

      if (!marketStatus.closed) {
        skipped.push({
          code: holding.code,
          market: holding.market || null,
          reason: marketStatus.reason,
        });
        continue;
      }

      try {
        const fetched = await tryFetchNaverPrice(holding.code, holding.market);

        if (!fetched) {
          skipped.push({
            code: holding.code,
            market: holding.market || null,
            reason: "No price found",
          });
          continue;
        }

        results.push({
          code: holding.code,
          price: fetched.price,
          date: marketStatus.tradingDate,
        });
      } catch (error) {
        skipped.push({
          code: holding.code,
          market: holding.market || null,
          reason: error.message || "Fetch failed",
        });
      }
    }

    if (results.length === 0) {
      return Response.json({
        success: true,
        updated: 0,
        message: "No price records fetched",
        skipped,
      });
    }

    const { error: upsertError } = await supabase.from("daily_prices").upsert(results);

    if (upsertError) {
      const missingDailyPricesTable =
        upsertError.message?.includes("Could not find the table") &&
        upsertError.message?.includes("daily_prices");

      if (missingDailyPricesTable) {
        return Response.json({
          success: true,
          updated: 0,
          message: "daily_prices 테이블이 없어 저장을 건너뜁니다.",
          skipped,
        });
      }

      throw new Error(`Failed to upsert daily prices: ${upsertError.message}`);
    }

    return Response.json({
      success: true,
      updated: results.length,
      skipped,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const transactions = Array.isArray(body?.transactions) ? body.transactions : [];
    const stockMaster = Array.isArray(body?.stockMaster) ? body.stockMaster : [];

    const targets = deriveTargetsFromTransactions(transactions, stockMaster);

    if (targets.length === 0) {
      return Response.json({
        success: true,
        updated: 0,
        targets: 0,
        message: "매수 거래 기준 수집 대상이 없습니다.",
      });
    }

    await ensureAssetsExist(supabase, targets);

    const rows = [];
    const skipped = [];

    for (const target of targets) {
      if (isForeignTicker(target.market, target.code)) {
        skipped.push({
          code: target.code,
          market: target.market,
          reason: "해외 종목 과거 종가 백필은 아직 지원하지 않습니다.",
        });
        continue;
      }

      try {
        const historyRows = await fetchDomesticHistory(target.code, target.startDate);

        if (historyRows.length === 0) {
          skipped.push({
            code: target.code,
            market: target.market,
            reason: "수집 가능한 과거 종가가 없습니다.",
          });
          continue;
        }

        rows.push(...historyRows);
      } catch (error) {
        skipped.push({
          code: target.code,
          market: target.market,
          reason: error.message || "Backfill failed",
        });
      }
    }

    if (rows.length === 0) {
      return Response.json({
        success: true,
        updated: 0,
        targets: targets.length,
        message: "백필된 종가 데이터가 없습니다.",
        skipped,
      });
    }

    const { error } = await supabase.from("daily_prices").upsert(rows);

    if (error) {
      throw new Error(`Failed to upsert daily prices: ${error.message}`);
    }

    return Response.json({
      success: true,
      updated: rows.length,
      targets: targets.length,
      skipped,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
