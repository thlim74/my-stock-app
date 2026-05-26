import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, anonKey);
};

export async function GET(request) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const date = searchParams.get("date");
    const raw = searchParams.get("raw");

    if (raw === "1") {
      const { data, error } = await supabase
        .from("daily_prices")
        .select("code, date, price")
        .order("date", { ascending: false });

      if (error) {
        const missingDailyPricesTable =
          error.message?.includes("Could not find the table") &&
          error.message?.includes("daily_prices");

        if (missingDailyPricesTable) {
          return NextResponse.json([]);
        }

        throw new Error(`Failed to load raw daily prices: ${error.message}`);
      }

      return NextResponse.json(data || []);
    }

    if (code || date) {
      let query = supabase
        .from("daily_prices")
        .select("code, date, price")
        .order("date", { ascending: false });

      if (code) {
        query = query.eq("code", code);
      }

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query.limit(500);

      if (error) {
        throw new Error(`Failed to load daily price history: ${error.message}`);
      }

      return NextResponse.json(data || []);
    }

    const { data, error } = await supabase
      .from("daily_prices")
      .select("code, date, price")
      .order("date", { ascending: false });

    if (error) {
      const missingDailyPricesTable =
        error.message?.includes("Could not find the table") &&
        error.message?.includes("daily_prices");

      if (missingDailyPricesTable) {
        return NextResponse.json([]);
      }

      throw new Error(`Failed to load daily prices: ${error.message}`);
    }

    const latestByCode = new Map();
    const previousByCode = new Map();
    const oldestByCode = new Map();
    const countByCode = new Map();

    for (const row of data || []) {
      countByCode.set(row.code, (countByCode.get(row.code) || 0) + 1);

      if (!latestByCode.has(row.code)) {
        latestByCode.set(row.code, row);
      } else if (!previousByCode.has(row.code)) {
        previousByCode.set(row.code, row);
      }

      oldestByCode.set(row.code, row);
    }

    const result = Array.from(latestByCode.entries()).map(([code, latest]) => ({
      code,
      latestDate: latest.date,
      latestPrice: latest.price,
      previousDate: previousByCode.get(code)?.date || null,
      previousPrice: previousByCode.get(code)?.price || null,
      oldestDate: oldestByCode.get(code)?.date || latest.date,
      rowCount: countByCode.get(code) || 1,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
