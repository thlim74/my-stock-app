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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code");
  const symbol = normalizeSymbol(rawCode);

  if (!symbol) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  try {
    if (!isForeignTicker(symbol)) {
      const response = await fetch(
        `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${encodeURIComponent(symbol)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        return NextResponse.json({ error: "Quote fetch failed" }, { status: 502 });
      }
      const payload = await response.json();
      const data = payload?.result?.areas?.[0]?.datas?.[0];
      if (!data) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      const over = data?.nxtOverMarketPriceInfo;
      const regularClose = parseNumber(data?.nv);
      const afterPrice = parseNumber(over?.overPrice) ?? regularClose;
      const source = parseNumber(over?.overPrice) != null ? "naver_after" : "naver_regular";

      return NextResponse.json({
        code: rawCode,
        symbol,
        regularClose,
        afterPrice,
        source,
        marketState: over?.overMarketStatus || data?.ms || null,
        regularMarketTime: null,
        postMarketTime: over?.localTradedAt || null,
      });
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Quote fetch failed" }, { status: 502 });
    }

    const payload = await response.json();
    const quote = payload?.quoteResponse?.result?.[0];
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
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

    return NextResponse.json({
      code: rawCode,
      symbol,
      regularClose,
      afterPrice,
      source,
      marketState: quote.marketState || null,
      regularMarketTime: quote.regularMarketTime || null,
      postMarketTime: quote.postMarketTime || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unknown server error" }, { status: 500 });
  }
}
