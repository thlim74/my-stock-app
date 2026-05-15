import { NextResponse } from "next/server";

export async function GET() {
  // 수집할 지수 심볼 (네이버 금융 기준)
  const symbols = [
    { name: "코스피", code: "KOSPI" },
    { name: "코스닥", code: "KOSDAQ" },
    { name: "S&P 500", code: "SPI@SPX" },
    { name: "나스닥", code: "NAS@IXIC" },
    { name: "다우존스", code: "DJI@DJI" },
  ];

  try {
    const results = await Promise.all(
      symbols.map(async (item) => {
        const res = await fetch(
          `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${item.code}`,
          {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "no-store",
          },
        );
        const data = await res.json();
        const info = data.result.areas[0].datas[0];

        return {
          name: item.name,
          value: info.nv.toLocaleString(), // 현재가
          change: (info.cv > 0 ? "+" : "") + info.cv.toLocaleString(), // 전일비
          rate: (info.cr > 0 ? "+" : "") + info.cr + "%", // 등락률
          isUp: info.cr > 0,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "지수 수집 실패" }, { status: 500 });
  }
}
