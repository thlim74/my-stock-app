import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { fetchKisMarketInvestorTime } from "@/lib/kis-market-investor";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market") === "KOSDAQ" ? "KOSDAQ" : "KOSPI";
    const data = await fetchKisMarketInvestorTime(market);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "시장별 시간 수급을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
