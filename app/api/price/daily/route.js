import { createClient } from "@supabase/supabase-js";

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

const tryFetchNaverPrice = async (code, market) => {
  const candidates = buildTickerCandidates(code, market);

  for (const candidate of candidates) {
    const response = await fetch(
      `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${candidate}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
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

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: holdings, error: holdingsError } = await supabase
      .from("assets")
      .select("code, market, name")
      .gt("quantity", 0);

    if (holdingsError) {
      const missingAssetsTable =
        holdingsError.message?.includes("Could not find the table") &&
        holdingsError.message?.includes("assets");

      if (missingAssetsTable) {
        return Response.json({
          success: true,
          updated: 0,
          message: "assets 테이블이 없어 일별 종가 수집을 건너뜁니다.",
        });
      }

      throw new Error(`Failed to load holdings: ${holdingsError.message}`);
    }

    const activeHoldings = (holdings || []).filter((holding) => holding.code);

    if (activeHoldings.length === 0) {
      return Response.json({ success: true, updated: 0, message: "No holdings" });
    }

    const today = new Date().toISOString().split("T")[0];
    const results = [];
    const skipped = [];

    for (const holding of activeHoldings) {
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
          date: today,
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

    const { error: upsertError } = await supabase
      .from("daily_prices")
      .upsert(results);

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
