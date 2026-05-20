import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "코드가 없습니다." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "종목 조회 응답이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder("euc-kr").decode(buffer);
    const data = JSON.parse(text);
    const name = data?.result?.areas?.[0]?.datas?.[0]?.nm;

    if (!name) {
      return NextResponse.json(
        { error: "종목을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ name });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류", detail: error.message },
      { status: 500 },
    );
  }
}
