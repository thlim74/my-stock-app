// app/api/price/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code"); // 종목코드 (예: 005930)

  if (!code)
    return NextResponse.json({ error: "Code is required" }, { status: 400 });

  try {
    // Yahoo Finance에서 데이터를 가져오는 무료 경로
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${code}.KS`,
      {
        next: { revalidate: 60 }, // 1분마다 캐시 갱신
      },
    );
    const data = await res.json();
    const price = data.chart.result[0].meta.regularMarketPrice;

    return NextResponse.json({ price });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 },
    );
  }
}
