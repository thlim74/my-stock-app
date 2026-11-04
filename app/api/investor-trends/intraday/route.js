import { NextResponse } from "next/server";
import { getCurrentUser, getServerSupabase } from "@/lib/server-auth";
import { fetchKisMarketInvestorTime } from "@/lib/kis-market-investor";

const getKstParts = (date = new Date()) => {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return {
    ...values,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const getFiveMinuteBucket = () => {
  const parts = getKstParts();
  const minute = String(Math.floor(parts.minute / 5) * 5).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${String(parts.hour).padStart(2, "0")}:${minute}:00+09:00`;
};

const isKoreanRegularSession = () => {
  const { weekday, hour, minute } = getKstParts();
  if (["Sat", "Sun"].includes(weekday)) return false;
  return (hour > 9 || (hour === 9 && minute >= 0)) && (hour < 15 || (hour === 15 && minute <= 30));
};

const getKstDayRange = () => {
  const { year, month, day } = getKstParts();
  const date = `${year}-${month}-${day}`;
  return {
    start: `${date}T00:00:00+09:00`,
    end: `${date}T23:59:59.999+09:00`,
  };
};

const storeAndLoadHistory = async (market, netValues) => {
  try {
    const supabase = getServerSupabase();
    if (isKoreanRegularSession()) {
      const { error } = await supabase
        .from("market_investor_snapshots")
        .upsert(
          {
            market,
            captured_at: getFiveMinuteBucket(),
            net_values: netValues,
          },
          { onConflict: "market,captured_at" },
        );
      if (error) return [];
    }

    const { start, end } = getKstDayRange();
    const { data, error } = await supabase
      .from("market_investor_snapshots")
      .select("captured_at, net_values")
      .eq("market", market)
      .gte("captured_at", start)
      .lte("captured_at", end)
      .order("captured_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (_error) {
    // The real-time quote remains available before the optional history table is created.
    return [];
  }
};

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market") === "KOSDAQ" ? "KOSDAQ" : "KOSPI";
    const data = await fetchKisMarketInvestorTime(market);
    const history = await storeAndLoadHistory(market, data.netValues);

    return NextResponse.json({ ...data, history }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "시장별 시간 수급을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
