import { NextResponse } from "next/server";

const normalizeSymbol = (rawCode) => {
  const raw = String(rawCode || "").trim().toUpperCase();
  if (!raw) return "";
  if (raw.includes(":")) return raw.split(":").pop();
  if (raw.includes(".")) return raw.split(".")[0];
  return raw;
};

const isForeignTicker = (code) => code && /^[A-Z]+$/.test(code);
const parseNumber = (value) => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const fetchAfterHours = async (rawCode) => {
  const symbol = normalizeSymbol(rawCode);
  if (!symbol) {
    return { code: rawCode, ok: false, error: "No code" };
  }

  if (!isForeignTicker(symbol)) {
    const response = await fetch(
      `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${encodeURIComponent(symbol)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return { code: rawCode, symbol, ok: false, error: "Quote fetch failed" };
    }
    const payload = await response.json();
    const data = payload?.result?.areas?.[0]?.datas?.[0];
    if (!data) {
      return { code: rawCode, symbol, ok: false, error: "Quote not found" };
    }

    const over = data?.nxtOverMarketPriceInfo;
    const regularClose = parseNumber(data?.nv);
    const afterPrice = parseNumber(over?.overPrice) ?? regularClose;
    const source = parseNumber(over?.overPrice) != null ? "naver_after" : "naver_regular";

    return {
      code: rawCode,
      symbol,
      regularClose,
      afterPrice,
      source,
      marketState: over?.overMarketStatus || data?.ms || null,
      regularMarketTime: null,
      postMarketTime: over?.localTradedAt || null,
      ok: true,
    };
  }

  const response = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return { code: rawCode, symbol, ok: false, error: "Quote fetch failed" };
  }

  const payload = await response.json();
  const quote = payload?.quoteResponse?.result?.[0];
  if (!quote) {
    return { code: rawCode, symbol, ok: false, error: "Quote not found" };
  }

  const regularClose = quote.regularMarketPrice ?? null;
  const afterPrice =
    quote.postMarketPrice ?? quote.preMarketPrice ?? quote.regularMarketPrice ?? null;
  const source =
    quote.postMarketPrice != null
      ? "post"
      : quote.preMarketPrice != null
        ? "pre"
        : "regular";

  return {
    code: rawCode,
    symbol,
    regularClose,
    afterPrice,
    source,
    marketState: quote.marketState || null,
    regularMarketTime: quote.regularMarketTime || null,
    postMarketTime: quote.postMarketTime || null,
    ok: true,
  };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const codes = Array.isArray(body?.codes)
      ? [...new Set(body.codes.map((code) => String(code || "").trim()).filter(Boolean))]
      : [];

    if (codes.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    const quotes = await Promise.all(codes.map(fetchAfterHours));
    return NextResponse.json({ quotes });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
