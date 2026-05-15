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
        // 해외 지수와 국내 지수 API 경로 대응
        const isGlobal = item.code.includes("@");
        const url = isGlobal
          ? `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${item.code}`
          : `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${item.code}`;

        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Referer: "https://finance.naver.com/",
          },
          next: { revalidate: 0 },
        });

        const data = await res.json();
        const dataSource = data?.result?.areas?.[0]?.datas?.[0];

        if (!dataSource) {
          return { name: item.name, value: "N/A", rate: "0%", isUp: true };
        }

        return {
          name: item.name,
          value: dataSource.nv.toLocaleString(),
          rate: (dataSource.cr > 0 ? "+" : "") + dataSource.cr + "%",
          isUp: dataSource.cr > 0,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "지수 연결 실패" }, { status: 500 });
  }
}
