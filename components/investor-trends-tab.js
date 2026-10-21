"use client";

import { useState } from "react";

const INVESTORS = [
  { key: "foreign", label: "외국인", tone: "text-rose-600" },
  { key: "institution", label: "기관", tone: "text-violet-600" },
  { key: "individual", label: "개인", tone: "text-sky-600" },
];

const PERIODS = [
  { key: "fiveDays", label: "5거래일 누적" },
  { key: "twentyDays", label: "20거래일 누적" },
];

const formatAmount = (value) => {
  const amount = Number(value) || 0;
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  const eok = Math.round(Math.abs(amount) / 100_000_000);
  return `${sign}${eok.toLocaleString()}억원`;
};

const amountTone = (value) =>
  Number(value) > 0 ? "text-rose-600" : Number(value) < 0 ? "text-blue-600" : "text-slate-500";

const formatAsOf = (asOf, time) => {
  if (!asOf) return "갱신 대기";
  const date = new Date(asOf);
  if (Number.isNaN(date.getTime())) return "갱신 대기";
  const label = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return time ? `${label} 기준` : `${label} 기준 (마감/집계)`;
};

export default function InvestorTrendsTab({ data, loading, error }) {
  const [market, setMarket] = useState("KOSPI");
  const trend = data?.markets?.[market];

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-cyan-300">MARKET FLOW</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">투자자별 매매동향</h2>
            <p className="mt-2 text-xs font-bold text-slate-300 sm:text-sm">장중 순매수와 5·20거래일 누적 수급을 함께 확인합니다.</p>
          </div>
          <p className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-cyan-100">
            {formatAsOf(trend?.today?.asOf, trend?.today?.time)}
          </p>
        </div>

        <div className="mt-5 flex w-fit rounded-xl bg-white/10 p-1">
          {["KOSPI", "KOSDAQ"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMarket(item)}
              className={`rounded-lg px-5 py-2 text-sm font-black transition-colors ${market === item ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:text-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading && !trend ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-sm font-bold text-slate-500">투자자 수급을 불러오는 중입니다.</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">수급 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>
      ) : null}

      {trend ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {INVESTORS.map((investor) => {
              const amount = trend.today?.[investor.key] || 0;
              return (
                <article key={investor.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className={`text-sm font-black ${investor.tone}`}>{investor.label}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">당일 순매수</p>
                  <p className={`mt-1 text-2xl font-black tracking-tight ${amountTone(amount)}`}>{formatAmount(amount)}</p>
                </article>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="font-black text-slate-800">누적 순매수</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">양수는 순매수, 음수는 순매도입니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full text-center text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-black">기간</th>
                    {INVESTORS.map((investor) => <th key={investor.key} className="px-5 py-3 text-xs font-black">{investor.label}</th>)}
                    <th className="px-5 py-3 text-xs font-black">집계 기간</th>
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => {
                    const values = trend[period.key] || {};
                    return (
                      <tr key={period.key} className="border-t border-slate-100">
                        <td className="px-5 py-4 text-left font-black text-slate-800">{period.label}</td>
                        {INVESTORS.map((investor) => <td key={investor.key} className={`px-5 py-4 font-black ${amountTone(values[investor.key])}`}>{formatAmount(values[investor.key])}</td>)}
                        <td className="px-5 py-4 text-xs font-bold text-slate-500">{values.bizdate || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="px-1 text-xs font-bold text-slate-400">장중 수급은 잠정치이며 마감 후 집계값으로 갱신됩니다. 데이터: 네이버 증권 KRX 시장 수급.</p>
        </>
      ) : null}
    </section>
  );
}
