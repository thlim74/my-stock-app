import { NextResponse } from "next/server";

const NAVER_INVESTOR_URL =
  "https://stock.naver.com/api/domestic/home/marketaggregate/aggregateInvestor";
const MARKETS = ["KOSPI", "KOSDAQ"];

const formatKstDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const getTradingDateOffset = (tradingDaysAgo) => {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  let remaining = tradingDaysAgo;

  while (remaining > 0) {
    kstNow.setUTCDate(kstNow.getUTCDate() - 1);
    const day = kstNow.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return formatKstDate(kstNow);
};

const fetchInvestorTrend = async (marketType, periodType, startDate) => {
  const investorTrend = { tradeType: "KRX", marketType, periodType };

  if (startDate) {
    investorTrend.startDate = startDate;
    investorTrend.endDate = getTradingDateOffset(0);
  }

  const response = await fetch(NAVER_INVESTOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: "https://stock.naver.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({ sections: { investorTrend } }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Investor trend request failed: ${response.status}`);

  const data = await response.json();
  const trend = data?.data?.investorTrend;
  if (!trend) throw new Error("Investor trend response is empty");

  return {
    individual: Number(trend.individual) || 0,
    foreign: Number(trend.foreign) || 0,
    institution: Number(trend.institution) || 0,
    bizdate: trend.bizdate || "",
    time: trend.time || "",
    asOf: data?.data?.asOf || data?.timestamp || null,
  };
};

export async function GET() {
  try {
    const fiveDaysAgo = getTradingDateOffset(4);
    const twentyDaysAgo = getTradingDateOffset(19);
    const results = await Promise.all(
      MARKETS.flatMap((market) => [
        fetchInvestorTrend(market, "TIME"),
        fetchInvestorTrend(market, "WEEK", fiveDaysAgo),
        fetchInvestorTrend(market, "MONTH", twentyDaysAgo),
      ]),
    );
    const markets = {};

    MARKETS.forEach((market, index) => {
      const offset = index * 3;
      markets[market] = {
        today: results[offset],
        fiveDays: results[offset + 1],
        twentyDays: results[offset + 2],
      };
    });

    return NextResponse.json(
      { source: "NAVER_FINANCE", markets },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600" } },
    );
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch investor trends" }, { status: 502 });
  }
}
