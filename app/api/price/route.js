// app/api/price/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let code = searchParams.get("code");

  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  // .KS 접미사 제거 (네이버 조회용)
  const pureCode = code.replace(".KS", "").replace(".KQ", "");

  try {
    // 네이버 금융 실시간 시세 API (가장 안정적임)
    const res = await fetch(
      `https://polling.finance.naver.com/api/realtime/getLowRealtime?symbolCode=${pureCode}`,
      { next: { revalidate: 60 } }
    );
    
    const data = await res.json();
    
    // 네이버 응답 구조에서 현재가 추출
    const price = data.result.areas[0].datas[0].nv;

    if (!price) throw new Error("Price not found");

    return NextResponse.json({ price });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch price from Naver" }, { status: 500 });
  }
}
