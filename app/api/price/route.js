import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code");

  if (!rawCode) return NextResponse.json({ error: "No code" }, { status: 400 });

  // 숫자만 남기기 (005930.KS -> 005930)
  const code = rawCode.split(".")[0];

  try {
    const naverUrl = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`;

    const response = await fetch(naverUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Naver response not ok");

    const data = await response.json();

    // 데이터 구조 안전하게 접근
    const price = data?.result?.areas?.[0]?.datas?.[0]?.nv;

    if (price === undefined || price === null) {
      console.error("Data structure mismatch:", data);
      return NextResponse.json(
        { error: "Price not found in data" },
        { status: 404 },
      );
    }

    return NextResponse.json({ price: price });
  } catch (error) {
    console.error("API Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
