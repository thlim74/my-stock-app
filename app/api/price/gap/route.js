import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const POINT_TYPES = new Set([
  "regular_close",
  "after_close",
  "pre_open",
  "regular_open",
]);
const FIRST_CAPTURE_TYPES = new Set(["pre_open", "regular_open"]);
const PAGE_SIZE = 1000;

const isMissingTableError = (error) =>
  error?.message?.includes("Could not find the table") &&
  error?.message?.includes("price_gap_points");

const isMissingColumnError = (error) =>
  error?.message?.includes("column") && error?.message?.includes("does not exist");

const normalizeDate = (value) => {
  const raw = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
};

const normalizePointType = (value) => {
  const raw = String(value || "").trim();
  const snake = raw.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return snake.replace(/[-\s]+/g, "_").replace(/^_/, "");
};

const parsePrice = (value) => {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(1, days));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toResponsePoint = (row) => ({
  code: row.code,
  date: row.date,
  pointType: row.point_type,
  price: Number(row.price),
  source: row.source || null,
  capturedAt: row.captured_at || null,
});

const dailyPriceRowToPoints = (row) => {
  const candidates = [
    ["regular_close", row.regular_close ?? row.price],
    ["after_close", row.after_close],
    ["pre_open", row.pre_open],
    ["regular_open", row.regular_open],
  ];

  return candidates
    .map(([pointType, value]) => ({
      code: row.code,
      date: row.date,
      pointType,
      price: parsePrice(value),
      source: row.price_source || "daily_prices_fallback",
      capturedAt: null,
    }))
    .filter((point) => point.price !== null);
};

const fetchDailyPriceFallbackPoints = async (supabase, { codes, days }) => {
  const selectCandidates = [
    "code,date,price,regular_close,after_close,pre_open,regular_open,price_source",
    "code,date,regular_close,after_close,pre_open,regular_open,price_source",
    "code,date,price",
  ];

  let lastError = null;
  for (const columns of selectCandidates) {
    let query = supabase
      .from("daily_prices")
      .select(columns)
      .gte("date", daysAgo(Number.isFinite(days) ? days : 7))
      .order("date", { ascending: false })
      .limit(1000);

    if (codes.length > 0) {
      query = query.in("code", codes);
    }

    const { data, error } = await query;
    if (!error) {
      return (data || []).flatMap(dailyPriceRowToPoints);
    }

    lastError = error;
    if (!isMissingColumnError(error)) break;
  }

  const missingDailyPricesTable =
    lastError?.message?.includes("Could not find the table") &&
    lastError?.message?.includes("daily_prices");
  if (missingDailyPricesTable) return [];
  throw lastError;
};

const dailyPriceColumnByPointType = {
  regular_close: "regular_close",
  after_close: "after_close",
  pre_open: "pre_open",
  regular_open: "regular_open",
};

const updateDailyPriceFallbackPoint = async (supabase, row) => {
  const column = dailyPriceColumnByPointType[row.point_type];
  if (!column) return false;

  let query = supabase
    .from("daily_prices")
    .update({
      [column]: row.price,
      price_source: row.source || "price_gap_fallback",
    })
    .eq("code", row.code)
    .eq("date", row.date)
    .select("code");

  if (row.point_type === "pre_open" || row.point_type === "regular_open") {
    query = query.is(column, null);
  }

  const { data, error } = await query;
  if (!error) {
    return (data || []).length > 0;
  }

  if (isMissingColumnError(error)) {
    return false;
  }

  const missingDailyPricesTable =
    error.message?.includes("Could not find the table") &&
    error.message?.includes("daily_prices");
  if (missingDailyPricesTable) return false;

  throw error;
};

const updateDailyPriceFallbackPoints = async (supabase, rows) => {
  let updated = 0;
  for (const row of rows) {
    // Sequential updates keep the fallback simple and avoid overwriting first-captured opens.
    // eslint-disable-next-line no-await-in-loop
    const saved = await updateDailyPriceFallbackPoint(supabase, row);
    if (saved) updated += 1;
  }
  return updated;
};

const normalizeIncomingPoint = (point) => {
  const code = String(point?.code || "").trim();
  const date = normalizeDate(point?.date);
  const pointType = normalizePointType(point?.pointType || point?.point_type);
  const price = parsePrice(point?.price);

  if (!code || !date || !POINT_TYPES.has(pointType) || price === null) {
    return null;
  }

  return {
    code,
    date,
    point_type: pointType,
    price,
    source: point?.source ? String(point.source).slice(0, 120) : null,
    captured_at: new Date().toISOString(),
  };
};

export async function GET(request) {
  try {
    const supabase = getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const codes = String(searchParams.get("codes") || "")
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);
    const days = Number(searchParams.get("days") || 7);

    const points = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("price_gap_points")
        .select("code,date,point_type,price,source,captured_at")
        .gte("date", daysAgo(Number.isFinite(days) ? days : 7))
        .order("date", { ascending: false })
        .range(from, to);

      if (codes.length > 0) {
        query = query.in("code", codes);
      }

      const { data, error } = await query;
      if (error) {
        if (isMissingTableError(error)) {
          const fallbackPoints = await fetchDailyPriceFallbackPoints(supabase, {
            codes,
            days,
          });
          return NextResponse.json({
            points: fallbackPoints,
            fallback: "daily_prices",
          });
        }
        throw error;
      }

      points.push(...(data || []).map(toResponsePoint));
      if (!data || data.length < PAGE_SIZE) break;
    }

    return NextResponse.json({ points });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const supabase = getServerSupabase();
    const body = await request.json().catch(() => ({}));
    const points = Array.isArray(body?.points)
      ? body.points.map(normalizeIncomingPoint).filter(Boolean)
      : [];

    if (points.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const deduped = new Map();
    points.forEach((point) => {
      deduped.set(`${point.code}:${point.date}:${point.point_type}`, point);
    });
    const rows = [...deduped.values()];
    const firstCaptureRows = rows.filter((row) => FIRST_CAPTURE_TYPES.has(row.point_type));
    const overwriteRows = rows.filter((row) => !FIRST_CAPTURE_TYPES.has(row.point_type));
    let updated = 0;

    if (firstCaptureRows.length > 0) {
      const { data, error } = await supabase
        .from("price_gap_points")
        .upsert(firstCaptureRows, {
          onConflict: "code,date,point_type",
          ignoreDuplicates: true,
        })
        .select("code");

      if (error) {
        if (isMissingTableError(error)) {
          const fallbackUpdated = await updateDailyPriceFallbackPoints(
            supabase,
            rows,
          );
          return NextResponse.json({
            success: true,
            updated: fallbackUpdated,
            fallback: "daily_prices",
          });
        }
        throw error;
      }
      updated += data?.length || 0;
    }

    if (overwriteRows.length > 0) {
      const { data, error } = await supabase
        .from("price_gap_points")
        .upsert(overwriteRows, { onConflict: "code,date,point_type" })
        .select("code");

      if (error) {
        if (isMissingTableError(error)) {
          const fallbackUpdated = await updateDailyPriceFallbackPoints(
            supabase,
            rows,
          );
          return NextResponse.json({
            success: true,
            updated: fallbackUpdated,
            fallback: "daily_prices",
          });
        }
        throw error;
      }
      updated += data?.length || 0;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
