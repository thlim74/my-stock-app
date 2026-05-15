import { NextResponse } from "next/server";

export async function GET() {
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
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
            next: { revalidate: 0 }, // 캐시 방지
          },
        );

        const data = await res.json();

        // 데이터 존재 여부 엄격히 체크 (에러 방지)
        if (
          !data.result ||
          !data.result.areas ||
          !data.result.areas[0].datas[0]
        ) {
          return { name: item.name, value: "N/A", rate: "0%", isUp: true };
        }

        const info = data.result.areas[0].datas[0];

        return {
          name: item.name,
          value: info.nv ? info.nv.toLocaleString() : "0",
          rate: (info.cr > 0 ? "+" : "") + (info.cr || 0) + "%",
          isUp: info.cr > 0,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Indices API Error:", error);
    return NextResponse.json({ error: "데이터 연결 실패" }, { status: 500 });
  }
}
