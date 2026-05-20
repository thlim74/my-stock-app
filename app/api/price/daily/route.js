import { createClient } from "@supabase/supabase-js";

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, anonKey);
};

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: holdings, error: holdingsError } = await supabase
      .from("assets")
      .select("code")
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

    const codes = (holdings || [])
      .map((holding) => holding.code)
      .filter(Boolean);

    if (codes.length === 0) {
      return Response.json({ success: true, updated: 0, message: "No holdings" });
    }

    const today = new Date().toISOString().split("T")[0];
    const results = [];

    for (const code of codes) {
      const res = await fetch(
        `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`,
        {
          headers: { "User-Agent": "Mozilla/5.0" },
          cache: "no-store",
        },
      );

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const price = data?.result?.areas?.[0]?.datas?.[0]?.nv;

      if (price === undefined || price === null) {
        continue;
      }

      results.push({
        code,
        price,
        date: today,
      });
    }

    if (results.length === 0) {
      return Response.json({
        success: true,
        updated: 0,
        message: "No price records fetched",
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
        });
      }

      throw new Error(`Failed to upsert daily prices: ${upsertError.message}`);
    }

    return Response.json({ success: true, updated: results.length });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
