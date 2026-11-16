import { NextResponse } from "next/server";
import { getKisNightFuturesWebSocketApproval } from "@/lib/kis-market-investor";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const approval = await getKisNightFuturesWebSocketApproval();
    return NextResponse.json(approval, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "야간선물 WebSocket 연결을 준비하지 못했습니다." },
      { status: 500 },
    );
  }
}
