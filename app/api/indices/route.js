import { NextResponse } from "next/server";

const SYMBOLS = [
  { key: "kospi", name: "KOSPI", code: "KOSPI" },
  { key: "kosdaq", name: "KOSDAQ", code: "KOSDAQ" },
  { key: "sp500", name: "S&P 500", code: "SPI@SPX" },
  { key: "nasdaq", name: "NASDAQ", code: "NAS@IXIC" },
  { key: "dow", name: "DOW JONES", code: "DJI@DJI" },
];

export async function GET() {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (item) => {
        const response = await fetch(
          `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${item.code}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Referer: "https://finance.naver.com/",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return {
            key: item.key,
            name: item.name,
            value: null,
            rate: null,
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
            rate: null,
            isUp: null,
          };
        }

        return {
          key: item.key,
          name: item.name,
          value: Number(source.nv),
          rate: Number(source.cr),
          isUp: Number(source.cr) >= 0,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch indices" }, { status: 500 });
  }
}
