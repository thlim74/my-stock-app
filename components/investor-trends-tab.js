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
  return `${sign}${eok.toLocaleString()}`;
};

const formatDate = (value) => {
  const date = String(value || "");
  return date.length === 8 ? `${date.slice(4, 6)}.${date.slice(6, 8)}` : "-";
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
    <section className="space-y-3 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-3.5 text-white sm:p-7">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div>
            <p className="hidden text-xs font-black tracking-[0.2em] text-cyan-300 sm:block">MARKET FLOW</p>
            <h2 className="text-lg font-black tracking-tight sm:mt-1 sm:text-3xl">투자자별 매매동향</h2>
            <p className="hidden mt-2 text-xs font-bold text-slate-300 sm:block">장중 순매수와 5·20거래일 누적 수급을 함께 확인합니다.</p>
          </div>
          <p className="rounded-lg bg-white/10 px-2 py-1 text-[9px] font-bold text-cyan-100 sm:px-3 sm:py-2 sm:text-xs">
            {formatAsOf(trend?.today?.asOf, trend?.today?.time)}
          </p>
        </div>

        <div className="mt-3 flex w-full rounded-xl bg-white/10 p-1 sm:mt-5 sm:w-fit">
          {["KOSPI", "KOSDAQ"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMarket(item)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-black transition-colors sm:flex-none sm:px-5 sm:py-2 sm:text-sm ${market === item ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:text-white"}`}
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {INVESTORS.map((investor) => {
              const amount = trend.today?.[investor.key] || 0;
              return (
                <article key={investor.key} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-5">
                  <p className={`text-[11px] font-black sm:text-sm ${investor.tone}`}>{investor.label}</p>
                  <p className="mt-0.5 text-[9px] font-bold text-slate-400 sm:mt-2 sm:text-xs">당일 순매수</p>
                  <p className={`mt-1 whitespace-nowrap text-[17px] font-black tracking-tight sm:text-2xl ${amountTone(amount)}`}>{formatAmount(amount)}</p>
                </article>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:block sm:px-5 sm:py-4">
              <h3 className="text-sm font-black text-slate-800 sm:text-base">누적 순매수</h3>
              <p className="text-[9px] font-bold text-slate-500 sm:mt-1 sm:text-xs">단위: 억원</p>
            </div>
            <div>
              <table className="w-full table-fixed text-center text-[10px] sm:text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-black sm:px-5 sm:py-3 sm:text-xs">기간</th>
                    {INVESTORS.map((investor) => <th key={investor.key} className="px-1 py-2 text-[10px] font-black sm:px-5 sm:py-3 sm:text-xs">{investor.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => {
                    const values = trend[period.key] || {};
                    return (
                      <tr key={period.key} className="border-t border-slate-100">
                        <td className="px-2 py-2.5 text-left font-black text-slate-800 sm:px-5 sm:py-4"><span className="sm:hidden">{period.key === "fiveDays" ? "5일" : "20일"}</span><span className="hidden sm:inline">{period.label}</span></td>
                        {INVESTORS.map((investor) => <td key={investor.key} className={`px-1 py-2.5 font-black whitespace-nowrap sm:px-5 sm:py-4 ${amountTone(values[investor.key])}`}>{formatAmount(values[investor.key])}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:block sm:px-5 sm:py-4">
              <h3 className="text-sm font-black text-slate-800 sm:text-base">최근 5거래일 일별 수급</h3>
              <p className="text-[9px] font-bold text-slate-500 sm:mt-1 sm:text-xs">단위: 억원</p>
            </div>
            <div>
              <table className="w-full table-fixed text-center text-[10px] sm:text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-black sm:px-5 sm:py-3 sm:text-xs">일자</th>
                    {INVESTORS.map((investor) => <th key={investor.key} className="px-1 py-2 text-[10px] font-black sm:px-5 sm:py-3 sm:text-xs">{investor.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(trend.daily || []).map((day) => (
                    <tr key={day.date} className="border-t border-slate-100">
                      <td className="px-2 py-2 text-left font-black text-slate-800 sm:px-5 sm:py-4">{formatDate(day.date)}</td>
                      {INVESTORS.map((investor) => <td key={investor.key} className={`px-1 py-2 font-black whitespace-nowrap sm:px-5 sm:py-4 ${amountTone(day[investor.key])}`}>{formatAmount(day[investor.key])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="hidden px-1 text-xs font-bold text-slate-400 sm:block">장중 수급은 잠정치이며 마감 후 집계값으로 갱신됩니다. 데이터: 네이버 증권 KRX 시장 수급.</p>
        </>
      ) : null}
    </section>
  );
}
