import { NextResponse } from "next/server";
import { fetchKisKospi200FuturesQuote } from "@/lib/kis-market-investor";

const DOMESTIC_SYMBOLS = [
  { key: "kospi", name: "KOSPI", code: "KOSPI" },
  { key: "kosdaq", name: "KOSDAQ", code: "KOSDAQ" },
];

const WORLD_SYMBOLS = [
  { key: "dow", name: "DOW JONES", code: ".DJI" },
  { key: "nasdaq", name: "NASDAQ", code: ".IXIC" },
  { key: "sp500", name: "S&P 500", code: ".INX" },
  { key: "philadelphiaSemiconductor", name: "PHILADELPHIA SEMICONDUCTOR", code: ".SOX" },
];

const YAHOO_SYMBOLS = [
  { key: "ewy", name: "EWY (MSCI KOREA ETF)", code: "EWY" },
  { key: "us10y", name: "US 10-YEAR TREASURY YIELD", code: "^TNX" },
  { key: "vix", name: "VIX", code: "^VIX" },
];

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://stock.naver.com/",
  Accept: "application/json",
};

const emptyItem = (key, name) => ({
  key,
  name,
  value: null,
  changePercent: null,
  isUp: null,
});

const toNumber = (value) => Number(String(value ?? "").replace(/,/g, ""));

const toQuoteItem = (source, key, name) => {
  const value = toNumber(source?.closePriceRaw ?? source?.closePrice);
  const changePercent = toNumber(
    source?.fluctuationsRatioRaw ?? source?.fluctuationsRatio,
  );

  if (!Number.isFinite(value) || !Number.isFinite(changePercent)) {
    return emptyItem(key, name);
  }

  return { key, name, value, changePercent, isUp: changePercent >= 0 };
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: COMMON_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Quote request failed: ${response.status}`);
  }

  return response.json();
};

const fetchDomesticItem = async (item) => {
  try {
    const data = await fetchJson(
      `https://polling.finance.naver.com/api/realtime/domestic/index/${item.code}`,
    );
    return toQuoteItem(data?.datas?.[0], item.key, item.name);
  } catch (_error) {
    return emptyItem(item.key, item.name);
  }
};

const fetchWorldItems = async () => {
  try {
    const codes = WORLD_SYMBOLS.map((item) => item.code).join(",");
    const data = await fetchJson(
      `https://stock.naver.com/api/polling/worldstock/index?reutersCodes=${encodeURIComponent(codes)}`,
    );
    const sources = new Map(
      (data?.datas ?? []).map((item) => [item.reutersCode, item]),
    );

    return WORLD_SYMBOLS.map((item) =>
      toQuoteItem(sources.get(item.code), item.key, item.name),
    );
  } catch (_error) {
    return WORLD_SYMBOLS.map((item) => emptyItem(item.key, item.name));
  }
};

const fetchNasdaq100Futures = async () => {
  try {
    const data = await fetchJson(
      "https://stock.naver.com/api/polling/worldstock/futures?reutersCodes=NQcv1",
    );
    return toQuoteItem(data?.datas?.[0], "nasdaq100Futures", "NASDAQ 100 FUTURES");
  } catch (_error) {
    return emptyItem("nasdaq100Futures", "NASDAQ 100 FUTURES");
  }
};

const fetchYahooItem = async (item) => {
  try {
    const data = await fetchJson(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.code)}?range=5d&interval=1d`,
    );
    const quote = data?.chart?.result?.[0]?.meta;
    const value = toNumber(quote?.regularMarketPrice);
    const changePercent = toNumber(quote?.regularMarketChangePercent);

    if (!Number.isFinite(value) || !Number.isFinite(changePercent)) {
      return emptyItem(item.key, item.name);
    }

    return { key: item.key, name: item.name, value, changePercent, isUp: changePercent >= 0 };
  } catch (_error) {
    return emptyItem(item.key, item.name);
  }
};

const fetchKospi200NightFutures = async () => {
  try {
    const quote = await fetchKisKospi200FuturesQuote();
    return {
      key: "kospi200NightFutures",
      name: "KOSPI 200 FUTURES",
      value: quote.value,
      changePercent: quote.changePercent,
      isUp: quote.changePercent >= 0,
    };
  } catch (_error) {
    return emptyItem("kospi200NightFutures", "KOSPI 200 FUTURES");
  }
};

const fetchUsdKrw = async () => {
  try {
    const data = await fetchJson(
      "https://api.stock.naver.com/marketindex/exchange/FX_USDKRW",
    );
    return toQuoteItem(data?.exchangeInfo, "exchangeRate", "USD/KRW");
  } catch (_error) {
    return emptyItem("exchangeRate", "USD/KRW");
  }
};

export async function GET() {
  const [domesticItems, worldItems, nasdaq100Futures, yahooItems, kospi200NightFutures, exchangeItem] =
    await Promise.all([
      Promise.all(DOMESTIC_SYMBOLS.map(fetchDomesticItem)),
      fetchWorldItems(),
      fetchNasdaq100Futures(),
      Promise.all(YAHOO_SYMBOLS.map(fetchYahooItem)),
      fetchKospi200NightFutures(),
      fetchUsdKrw(),
    ]);

  return NextResponse.json([
    ...domesticItems,
    ...worldItems,
    nasdaq100Futures,
    ...yahooItems,
    kospi200NightFutures,
    exchangeItem,
  ]);
}
