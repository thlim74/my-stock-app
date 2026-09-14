import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server-auth";

const DAILY_PRICE_PAGE_SIZE = 1000;
const EXTENDED_DAILY_PRICE_COLUMNS =
  "code, date, price, regular_close, after_close, pre_open, regular_open, price_source";
const EXTENDED_DAILY_PRICE_COLUMNS_WITHOUT_PRICE =
  "code, date, regular_close, after_close, pre_open, regular_open, price_source";
const CLOSE_PRICE_DAILY_PRICE_COLUMNS =
  "code, date, close_price, regular_close, after_close, pre_open, regular_open, price_source";
const CLOSING_PRICE_DAILY_PRICE_COLUMNS =
  "code, date, closing_price, regular_close, after_close, pre_open, regular_open, price_source";
const CLOSE_DAILY_PRICE_COLUMNS =
  "code, date, close, regular_close, after_close, pre_open, regular_open, price_source";
const LEGACY_DAILY_PRICE_COLUMNS = "code, date, price";

const isMissingColumnError = (error) =>
  error?.message?.includes("column") && error?.message?.includes("does not exist");

const getClosePrice = (row) => {
  const value = row?.price ?? row?.regular_close ?? row?.close_price ?? row?.closing_price ?? row?.close;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeDailyPriceRow = (row) => ({
  ...row,
  price: getClosePrice(row),
  regular_close: row.regular_close ?? getClosePrice(row),
  after_close: row.after_close ?? null,
  pre_open: row.pre_open ?? null,
  regular_open: row.regular_open ?? null,
  price_source: row.price_source ?? null,
});

const runDailyPriceQuery = async (buildQuery) => {
  const selectCandidates = [
    EXTENDED_DAILY_PRICE_COLUMNS,
    EXTENDED_DAILY_PRICE_COLUMNS_WITHOUT_PRICE,
    CLOSE_PRICE_DAILY_PRICE_COLUMNS,
    CLOSING_PRICE_DAILY_PRICE_COLUMNS,
    CLOSE_DAILY_PRICE_COLUMNS,
    LEGACY_DAILY_PRICE_COLUMNS,
  ];

  let lastError = null;
  for (const columns of selectCandidates) {
    const { data, error } = await buildQuery(columns);
    if (!error) {
      return { data: (data || []).map(normalizeDailyPriceRow), error: null };
    }

    lastError = error;
    if (!isMissingColumnError(error)) {
      break;
    }
  }

  return { data: null, error: lastError };
};

const fetchAllDailyPrices = async (supabase) => {
  const rows = [];
  for (let from = 0; ; from += DAILY_PRICE_PAGE_SIZE) {
    const to = from + DAILY_PRICE_PAGE_SIZE - 1;
    const { data, error } = await runDailyPriceQuery((columns) =>
      supabase
        .from("daily_prices")
        .select(columns)
        .order("date", { ascending: false })
        .range(from, to),
    );

    if (error) {
      throw error;
    }

    rows.push(...(data || []));

    if (!data || data.length < DAILY_PRICE_PAGE_SIZE) {
      break;
    }
  }

  return rows;
};

export async function GET(request) {
  try {
    const supabase = getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const date = searchParams.get("date");
    const raw = searchParams.get("raw");

    if (raw === "1") {
      try {
        const data = await fetchAllDailyPrices(supabase);
        return NextResponse.json(data);
      } catch (error) {
        const missingDailyPricesTable =
          error.message?.includes("Could not find the table") &&
          error.message?.includes("daily_prices");

        if (missingDailyPricesTable) {
          return NextResponse.json([]);
        }

        throw new Error(`Failed to load raw daily prices: ${error.message}`);
      }
    }

    if (code || date) {
      const { data, error } = await runDailyPriceQuery((columns) => {
        let query = supabase
          .from("daily_prices")
          .select(columns)
          .order("date", { ascending: false });

        if (code) {
          query = query.eq("code", code);
        }

        if (date) {
          query = query.eq("date", date);
        }

        return query.limit(500);
      });

      if (error) {
        if (error) {
          throw new Error(`Failed to load daily price history: ${error.message}`);
        }
      }

      return NextResponse.json(data || []);
    }

    let data = [];
    try {
      data = await fetchAllDailyPrices(supabase);
    } catch (error) {
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
      latestRegularClose: latest.regular_close ?? latest.price,
      latestAfterClose: latest.after_close ?? null,
      latestPreOpen: latest.pre_open ?? null,
      latestRegularOpen: latest.regular_open ?? null,
      previousDate: previousByCode.get(code)?.date || null,
      previousPrice: previousByCode.get(code)?.price || null,
      previousRegularClose:
        previousByCode.get(code)?.regular_close ?? previousByCode.get(code)?.price ?? null,
      previousAfterClose: previousByCode.get(code)?.after_close ?? null,
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
