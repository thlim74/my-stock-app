import { NextResponse } from "next/server";

export async function GET() {
  // 해외 지수는 코드 앞에 'SPI@', 'NAS@', 'DJI@' 등이 붙어야 정확합니다.
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
              Referer: "https://finance.naver.com/",
            },
            next: { revalidate: 0 },
          },
        );

        const data = await res.json();

        // 데이터 경로가 비어있을 경우 예외 처리
        const dataSource = data?.result?.areas?.[0]?.datas?.[0];

        if (!dataSource) {
          return { name: item.name, value: "N/A", rate: "0%", isUp: true };
        }

        // nv(현재가) 또는 cd(등락) 필드가 해외 지수는 다를 수 있으므로 안전하게 추출
        const currentVal = dataSource.nv
          ? (dataSource.nv / (item.code.includes("@") ? 1 : 1)).toLocaleString()
          : "0";
        const rateVal = dataSource.cr || 0;

        return {
          name: item.name,
          value: currentVal,
          rate: (rateVal > 0 ? "+" : "") + rateVal + "%",
          isUp: rateVal > 0,
        };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Indices API Error:", error);
    return NextResponse.json(
      { error: "지수 데이터 연결 실패" },
      { status: 500 },
    );
  }
}
