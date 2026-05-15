import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  try {
    // 1. 현재 '보유 중'인 종목 코드만 추출 (수량이 0보다 큰 종목)
    const { data: holdings } = await supabase
      .from("assets")
      .select("code")
      .gt("quantity", 0);

    const codes = holdings.map((h) => h.code);

    // 2. 보유 종목들에 대해서만 가격 데이터 수집
    const pricePromises = codes.map(async (code) => {
      const res = await fetch(
        `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`,
      );
      const data = await res.json();
      return {
        code,
        price: data.result.areas[0].datas[0].nv,
        date: new Date().toISOString().split("T")[0],
      };
    });

    const results = await Promise.all(pricePromises);

    // 3. 수집된 종목별 종가 DB 저장
    await supabase.from("daily_prices").upsert(results);

    return Response.json({ success: true, updated: results.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
