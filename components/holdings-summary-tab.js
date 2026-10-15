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

export default function HoldingsSummaryTab({ stats, formatNum, formatFloat }) {
  const [marketFilter, setMarketFilter] = useState("all");
  const [sortBy, setSortBy] = useState("evaluation");
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
      .sort((a, b) => b[sortBy] - a[sortBy]),
    [holdings, marketFilter, sortBy],
  );

  const marketTabs = [
    ["all", `전체 ${counts.all}`],
    ["domestic", `한국 ${counts.domestic}`],
    ["foreign", `미국 ${counts.foreign}`],
  ];

  return (
    <section className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-xl shadow-slate-300/40">
        <div className="bg-[radial-gradient(circle_at_top_right,_#0e7490_0,_transparent_38%),linear-gradient(135deg,_#020617,_#0f172a)] px-5 pb-6 pt-5 sm:px-7">
          <p className="text-[11px] font-black tracking-[0.18em] text-cyan-300">PORTFOLIO SNAPSHOT</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">보유요약</h2>
              <p className="mt-1 text-[12px] font-bold text-slate-400">현재가 기준, 보유 종목을 빠르게 확인합니다.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400">총 평가금액</p>
              <p className="mt-1 text-base font-black text-cyan-200 sm:text-lg">{formatNum(stats?.totalEvaluation || 0)}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-800 px-4 pt-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {marketTabs.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMarketFilter(value)}
                className={`shrink-0 border-b-2 px-3 py-3 text-[13px] font-black transition-colors ${
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

        <div className="flex items-center justify-between gap-2 bg-slate-900 px-4 py-3 sm:px-6">
          <p className="text-[11px] font-black text-slate-400">정렬 기준</p>
          <div className="flex rounded-lg bg-slate-800 p-1 text-[11px] font-black">
            <button
              onClick={() => setSortBy("evaluation")}
              className={`rounded-md px-3 py-1.5 ${sortBy === "evaluation" ? "bg-cyan-500 text-slate-950" : "text-slate-400"}`}
            >
              평가금액
            </button>
            <button
              onClick={() => setSortBy("currentPrice")}
              className={`rounded-md px-3 py-1.5 ${sortBy === "currentPrice" ? "bg-cyan-500 text-slate-950" : "text-slate-400"}`}
            >
              현재가
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800 px-4 sm:px-6">
          {visibleHoldings.map((holding) => {
            const foreign = isForeignMarket(holding.market, holding.ticker);
            const positive = holding.profitRate >= 0;
            const price = foreign ? `$ ${formatFloat(holding.currentPrice)}` : formatNum(holding.currentPrice);
            const average = foreign ? `$ ${formatFloat(holding.averageUsd)}` : formatNum(holding.averagePrice);

            return (
              <article key={holding.ticker || holding.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-5">
                <div className="min-w-0">
                  <h3 className="truncate text-[18px] font-black tracking-tight text-white sm:text-xl">{holding.name}</h3>
                  <p className="mt-1 text-[12px] font-bold text-slate-400">{formatNum(holding.quantity)}주 · {holding.market}:{holding.ticker}</p>
                  <p className="mt-2 text-[13px] font-bold text-slate-400">내 평균 <span className="text-slate-200">{average}</span></p>
                </div>
                <div className="min-w-[110px] text-right sm:min-w-[145px]">
                  <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-[15px] font-black ${positive ? "bg-rose-500/15 text-rose-300" : "bg-blue-500/15 text-blue-300"}`}>
                    {positive ? "▲" : "▼"} {formatRate(holding.profitRate)}
                  </span>
                  <p className="mt-2 text-[17px] font-black text-white sm:text-xl">{price}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">평가 {formatNum(holding.evaluation)}</p>
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
