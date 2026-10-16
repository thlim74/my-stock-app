"use client";

import { useMemo, useState } from "react";
import { isForeignMarket } from "@/lib/market-utils";

const toNumber = (value) => Number(value) || 0;

const holdingView = (holding) => ({
  name: String(holding?.종목명 || ""),
  ticker: String(holding?.티커 || ""),
  market: String(holding?.시장 || "KOSPI"),
  quantity: toNumber(holding?.보유수량),
  averagePrice: toNumber(holding?.평균단가),
  averageUsd: toNumber(holding?.평균단가_달러기준),
  currentPrice: toNumber(holding?.현재가),
  evaluation: toNumber(holding?.평가금액),
  profit: toNumber(holding?.손익),
  profitRate: Number.parseFloat(holding?.수익률) || 0,
});

const formatRate = (value) => `${Math.abs(value).toFixed(2)}%`;

export default function HoldingsSummaryTab({
  stats,
  dailyPriceSnapshots,
  today,
  exchangeRate,
  formatNum,
  formatFloat,
}) {
  const [marketFilter, setMarketFilter] = useState("all");
  const holdings = (stats?.holdingList || []).map(holdingView);

  const counts = useMemo(
    () => ({
      all: holdings.length,
      domestic: holdings.filter((holding) => !isForeignMarket(holding.market, holding.ticker)).length,
      foreign: holdings.filter((holding) => isForeignMarket(holding.market, holding.ticker)).length,
    }),
    [holdings],
  );

  const visibleHoldings = useMemo(
    () => holdings
      .filter((holding) => {
        if (marketFilter === "domestic") return !isForeignMarket(holding.market, holding.ticker);
        if (marketFilter === "foreign") return isForeignMarket(holding.market, holding.ticker);
        return true;
      })
      .sort((a, b) => {
        const evaluation = b.evaluation - a.evaluation;
        if (evaluation !== 0) return evaluation;
        return a.name.localeCompare(b.name, "ko");
      }),
    [holdings, marketFilter],
  );

  const marketTabs = [
    ["all", `전체 ${counts.all}`],
    ["domestic", `한국 ${counts.domestic}`],
    ["foreign", `미국 ${counts.foreign}`],
  ];

  return (
    <section className="mx-auto max-w-none sm:max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-300/40 sm:rounded-[28px]">
        <div className="bg-[radial-gradient(circle_at_top_right,_#0e7490_0,_transparent_38%),linear-gradient(135deg,_#020617,_#0f172a)] px-4 py-3 sm:px-7 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black tracking-[0.15em] text-cyan-300 sm:text-[11px]">PORTFOLIO SNAPSHOT</p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-white sm:mt-2 sm:text-2xl">보유요약</h2>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 sm:text-[10px]">총 평가금액</p>
              <p className="mt-0.5 text-sm font-black text-cyan-200 sm:mt-1 sm:text-lg">{formatNum(stats?.totalEvaluation || 0)}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-800 px-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {marketTabs.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMarketFilter(value)}
                className={`shrink-0 border-b-2 px-3 py-2 text-[12px] font-black transition-colors sm:py-3 sm:text-[13px] ${
                  marketFilter === value
                    ? "border-cyan-300 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-800 bg-slate-900 px-3 py-1.5 text-right text-[10px] font-black text-slate-500 sm:px-6 sm:py-2">
          평가금액 큰 순
        </div>

        <div className="divide-y divide-slate-800 px-3 sm:px-6">
          {visibleHoldings.map((holding) => {
            const foreign = isForeignMarket(holding.market, holding.ticker);
            const positive = holding.profitRate >= 0;
            const profitPositive = holding.profit >= 0;
            const price = foreign ? `$ ${formatFloat(holding.currentPrice)}` : formatNum(holding.currentPrice);
            const average = foreign ? `$ ${formatFloat(holding.averageUsd)}` : formatNum(holding.averagePrice);
            const snapshot = dailyPriceSnapshots?.[holding.ticker];
            const referenceClose =
              snapshot?.latestDate === today && snapshot?.previousRegularClose != null
                ? Number(snapshot.previousRegularClose)
                : Number(snapshot?.latestRegularClose ?? snapshot?.latestPrice);
            const hasReference = Number.isFinite(referenceClose) && referenceClose > 0;
            const dayProfit = hasReference
              ? foreign
                ? (holding.currentPrice - referenceClose) * holding.quantity * exchangeRate
                : (holding.currentPrice - referenceClose) * holding.quantity
              : null;
            const dayRate = hasReference
              ? ((holding.currentPrice - referenceClose) / referenceClose) * 100
              : null;
            const dayPositive = dayProfit !== null && dayProfit >= 0;

            return (
              <article key={holding.ticker || holding.name} className="grid grid-cols-[minmax(0,1fr)_210px] gap-x-3 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_230px] sm:gap-x-4 sm:gap-y-2 sm:py-5">
                <h3 className="col-span-2 break-keep text-[15px] font-black tracking-tight text-white sm:text-xl">{holding.name}</h3>
                <div className="min-w-0 self-center">
                  <p className="break-all text-[10px] font-bold leading-snug text-slate-400 sm:text-[12px]">{formatNum(holding.quantity)}주 · {holding.market}:{holding.ticker}</p>
                  <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-400 sm:mt-2 sm:text-[13px]">내 평균 <span className="text-slate-200">{average}</span></p>
                </div>
                <div className="space-y-1 text-left sm:space-y-1.5">
                  <p className="flex items-baseline gap-1 whitespace-nowrap text-[11px] font-bold sm:text-[13px]">
                    <span className="text-slate-500">평가액</span>
                    <span className="text-white">{formatNum(holding.evaluation)}</span>
                  </p>
                  <p className="flex items-baseline gap-1 whitespace-nowrap text-[11px] font-bold sm:text-[13px]">
                    <span className="text-slate-500">현재가</span>
                    <span className="text-slate-100">{price}</span>
                    <span className={dayRate === null ? "text-slate-600" : dayPositive ? "text-rose-300" : "text-blue-300"}>
                      ({dayRate === null ? "-" : `${dayPositive ? "+" : "-"}${formatRate(dayRate)}`})
                    </span>
                  </p>
                  <p className="flex items-baseline gap-1 whitespace-nowrap text-[11px] font-bold sm:text-[13px]">
                    <span className="text-slate-500">총수익</span>
                    <span className={profitPositive ? "text-rose-300" : "text-blue-300"}>{profitPositive ? "+" : ""}{formatNum(holding.profit)}</span>
                    <span className={positive ? "text-rose-300" : "text-blue-300"}>({positive ? "+" : "-"}{formatRate(holding.profitRate)})</span>
                  </p>
                  <p className={`whitespace-nowrap text-[11px] font-black sm:text-[13px] ${dayProfit === null ? "text-slate-600" : dayPositive ? "text-rose-300" : "text-blue-300"}`}>
                    {dayProfit === null ? "일수익 -" : `일수익 ${dayPositive ? "+" : ""}${formatNum(dayProfit)}`}
                  </p>
                </div>
              </article>
            );
          })}
          {visibleHoldings.length === 0 && (
            <p className="py-12 text-center text-[13px] font-bold text-slate-500">표시할 보유 종목이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}
