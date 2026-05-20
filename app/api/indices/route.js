import { NextResponse } from "next/server";

const DOMESTIC_SYMBOLS = [
  { key: "kospi", name: "KOSPI", code: "KOSPI" },
  { key: "kosdaq", name: "KOSDAQ", code: "KOSDAQ" },
];

const WORLD_SYMBOLS = [
  { key: "dow", name: "DOW JONES", symbol: "DJI@DJI" },
  { key: "nasdaq", name: "NASDAQ", symbol: "NAS@IXIC" },
  { key: "sp500", name: "S&P 500", symbol: "SPI@SPX" },
];

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://finance.naver.com/",
};

const parseWorldIndex = (html, symbol, key, name) => {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(
      `"${escaped}":\\{[^}]*"last":([0-9.]+),[^}]*"rate":(-?[0-9.]+)`,
    ),
  );

  if (!match) {
    return {
      key,
      name,
      value: null,
      changePercent: null,
      isUp: null,
    };
  }

  const value = Number(match[1]);
  const changePercent = Number(match[2]);

  return {
    key,
    name,
    value,
    changePercent,
    isUp: changePercent >= 0,
  };
};

const parseUsdKrw = (html) => {
  const blockMatch = html.match(
    /marketindexCd=FX_USDKRW[\s\S]*?<td>([0-9,]+(?:\.[0-9]+)?)<\/td>[\s\S]*?<em class="bu_p ([^"]+)">[\s\S]*?<\/em>\s*([0-9,]+(?:\.[0-9]+)?)/,
  );

  if (!blockMatch) {
    return {
      key: "exchangeRate",
      name: "USD/KRW",
      value: null,
      changePercent: null,
      isUp: null,
    };
  }

  const current = Number(blockMatch[1].replace(/,/g, ""));
  const directionClass = blockMatch[2];
  const absDiff = Number(blockMatch[3].replace(/,/g, ""));
  const signedDiff = directionClass.includes("up") ? absDiff : -absDiff;
  const previous = current - signedDiff;
  const changePercent = previous ? (signedDiff / previous) * 100 : 0;

  return {
    key: "exchangeRate",
    name: "USD/KRW",
    value: current,
    changePercent,
    isUp: signedDiff >= 0,
  };
};

export async function GET() {
  try {
    const [domesticResponses, worldResponse, homeResponse] = await Promise.all([
      Promise.all(
        DOMESTIC_SYMBOLS.map((item) =>
          fetch(
            `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${item.code}`,
            {
              headers: COMMON_HEADERS,
              cache: "no-store",
            },
          ),
        ),
      ),
      fetch("https://finance.naver.com/world/", {
        headers: COMMON_HEADERS,
        cache: "no-store",
      }),
      fetch("https://finance.naver.com/", {
        headers: COMMON_HEADERS,
        cache: "no-store",
      }),
    ]);

    const domesticItems = await Promise.all(
      domesticResponses.map(async (response, index) => {
        const item = DOMESTIC_SYMBOLS[index];

        if (!response.ok) {
          return {
            key: item.key,
            name: item.name,
            value: null,
            changePercent: null,
            isUp: null,
          };
        }

        const data = await response.json();
        const source = data?.result?.areas?.[0]?.datas?.[0];

        if (!source) {
          return {
            key: item.key,
            name: item.name,
            value: null,
            changePercent: null,
            isUp: null,
          };
        }

        return {
          key: item.key,
          name: item.name,
          value: Number(source.nv) / 100,
          changePercent: Number(source.cr),
          isUp: Number(source.cr) >= 0,
        };
      }),
    );

    const worldHtml = await worldResponse.text();
    const homeBuffer = Buffer.from(await homeResponse.arrayBuffer());
    const homeHtml = new TextDecoder("euc-kr").decode(homeBuffer);

    const worldItems = WORLD_SYMBOLS.map((item) =>
      parseWorldIndex(worldHtml, item.symbol, item.key, item.name),
    );
    const exchangeItem = parseUsdKrw(homeHtml);

    return NextResponse.json([...domesticItems, ...worldItems, exchangeItem]);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch indices" }, { status: 500 });
  }
}
