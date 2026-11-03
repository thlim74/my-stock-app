const WORLD_STOCK_URL = "https://stock.naver.com/api/polling/worldstock/stock";

const parseNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
};

const normalizeSymbol = (rawCode) => {
  const raw = String(rawCode || "").trim().toUpperCase();
  if (!raw) return "";
  return raw.includes(":") ? raw.split(":").pop() : raw;
};

const buildReutersCandidates = (rawCode) => {
  const normalized = normalizeSymbol(rawCode);
  if (!normalized) return [];

  const explicit = /^[A-Z0-9.-]+\.(?:O|N|A)$/.test(normalized) ? normalized : null;
  const symbol = normalized.split(".")[0];
  return [...new Set([explicit, `${symbol}.O`, `${symbol}.N`, `${symbol}.A`].filter(Boolean))];
};

export const fetchNaverWorldStockQuote = async (rawCode) => {
  for (const reutersCode of buildReutersCandidates(rawCode)) {
    try {
      const response = await fetch(
        `${WORLD_STOCK_URL}?reutersCodes=${encodeURIComponent(reutersCode)}`,
        {
          headers: {
            Accept: "application/json, text/plain, */*",
            Referer: "https://stock.naver.com/",
            "User-Agent": "Mozilla/5.0",
          },
          cache: "no-store",
        },
      );
      if (!response.ok) continue;

      const payload = await response.json();
      const quote = payload?.datas?.[0];
      const regularClose = parseNumber(quote?.closePriceRaw ?? quote?.closePrice);
      if (regularClose === null || regularClose <= 0) continue;

      const over = quote?.overMarketPriceInfo;
      const extendedPrice = parseNumber(over?.overPrice);
      const session = String(over?.tradingSessionType || "").toUpperCase();

      return {
        symbol: normalizeSymbol(rawCode).split(".")[0],
        reutersCode,
        regularClose,
        afterPrice: extendedPrice ?? regularClose,
        preOpen: session === "PRE_MARKET" ? extendedPrice : null,
        regularOpen: parseNumber(quote?.openPriceRaw ?? quote?.openPrice),
        source:
          session === "AFTER_MARKET"
            ? "naver_world_after"
            : session === "PRE_MARKET"
              ? "naver_world_pre"
              : "naver_world_regular",
        marketState: over?.marketStatus || quote?.marketStatus || null,
        regularMarketTime: quote?.localTradedAt || null,
        postMarketTime: over?.localTradedAt || null,
      };
    } catch (_error) {
      // Try the other exchange suffix before treating the quote as unavailable.
    }
  }

  return null;
};
