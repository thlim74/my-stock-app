export const normalizeTicker = (ticker) =>
  String(ticker || "")
    .trim()
    .toUpperCase();

export const isLikelyForeignTicker = (ticker) => {
  const normalized = normalizeTicker(ticker);
  if (!normalized) return false;
  if (normalized.includes(":")) return true;
  if (/^[A-Z]{1,6}(\.[A-Z]{1,3})?$/.test(normalized)) return true;
  return false;
};

export const inferMarketFromTicker = (ticker) =>
  isLikelyForeignTicker(ticker) ? "NASDAQ" : "KOSPI";

export const isForeignMarket = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  market === "AMEX" ||
  isLikelyForeignTicker(ticker);

