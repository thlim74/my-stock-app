"use client";

import { useMemo, useState } from "react";
import { isForeignMarket } from "@/lib/market-utils";
import { calculateHoldingDailyProfit } from "@/lib/holding-daily-profit";

const findFirst = (obj, keys, fallback = undefined) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) {
      return obj[key];
    }
  }
  return fallback;
};

const toNumber = (value) => Number(value) || 0;

const holdingView = (holding) => ({
  name: String(findFirst(holding, ["종목명"], "")),
  ticker: String(findFirst(holding, ["티커"], "")),
  market: String(findFirst(holding, ["시장"], "KOSPI")),
  qty: toNumber(findFirst(holding, ["보유수량"], 0)),
  principal: toNumber(findFirst(holding, ["순투자원금"], 0)),
  avgKrw: toNumber(findFirst(holding, ["평균단가"], 0)),
  avgUsd: toNumber(findFirst(holding, ["평균단가_달러기준"], 0)),
  currentPrice: toNumber(findFirst(holding, ["현재가"], 0)),
  evalAmount: toNumber(findFirst(holding, ["평가금액"], 0)),
  evalProfit: toNumber(findFirst(holding, ["손익"], 0)),
  evalRate: String(findFirst(holding, ["수익률"], "0.00%")),
});

const pointLabels = {
  prevClose: "전일 정규장 종가",
  prevAfter: "전일 애프터마켓 종가",
  preOpen: "당일 사전장 시초가",
  regularOpen: "당일 정규장 시초가",
};

const dateLabel = (date) => String(date || "").slice(5).replace("-", ".");

const pickPositiveNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }
  return null;
};

const formatSignedRate = (current, base) => {
  const currentValue = Number(current);
  const baseValue = Number(base);
  if (!Number.isFinite(currentValue) || !Number.isFinite(baseValue) || currentValue <= 0 || baseValue <= 0) {
    return "-";
  }
  const rate = ((currentValue - baseValue) / baseValue) * 100;
  return `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
};

function PriceGapAnalysis({
  holdings,
  dailyPriceHistoryMap,
  dailyPriceDetailMap,
  priceGapPointsMap,
  today,
  formatNum,
  formatFloat,
}) {
  const [selectedTicker, setSelectedTicker] = useState("");
  const selectedHolding =
    holdings.find((holding) => holding.ticker === selectedTicker) || holdings[0];

  const analysis = useMemo(() => {
    if (!selectedHolding) return null;
    const history = dailyPriceHistoryMap?.[selectedHolding.ticker] || {};
    const detailHistory = dailyPriceDetailMap?.[selectedHolding.ticker] || {};
    const gapHistory = priceGapPointsMap?.[selectedHolding.ticker] || {};
    const dates = [
      ...new Set([
        ...Object.keys(history),
        ...Object.keys(detailHistory),
        ...Object.keys(gapHistory),
      ]),
    ]
      .filter((date) => date <= today)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5)
      .sort((a, b) => a.localeCompare(b));
    const closeDates = [
      ...new Set([
        ...Object.keys(history),
        ...Object.keys(detailHistory),
        ...Object.keys(gapHistory),
      ]),
    ]
      .filter(
        (date) =>
          date <= today &&
          pickPositiveNumber(
            gapHistory[date]?.regularClose,
            detailHistory[date]?.regularClose,
            history[date],
          ) !== null,
      )
      .sort((a, b) => a.localeCompare(b));
    const rows = {
      prevClose: {},
      prevAfter: {},
      preOpen: {},
      regularOpen: {},
    };

    dates.forEach((date) => {
      const previousDate = closeDates
        .filter((itemDate) => itemDate < date)
        .sort((a, b) => b.localeCompare(a))[0];
      const detail = detailHistory[date] || {};
      const gap = gapHistory[date] || {};
      const previousDetail = previousDate ? detailHistory[previousDate] || {} : {};
      const previousGap = previousDate ? gapHistory[previousDate] || {} : {};
      rows.prevClose[date] = previousDate
        ? pickPositiveNumber(
            previousGap.regularClose,
            previousDetail.regularClose,
            history[previousDate],
          )
        : null;
      rows.prevAfter[date] = pickPositiveNumber(
        previousGap.afterClose,
        previousDetail.afterClose,
      );
      rows.preOpen[date] = pickPositiveNumber(gap.preOpen, detail.preOpen);
      rows.regularOpen[date] = pickPositiveNumber(gap.regularOpen, detail.regularOpen);
    });

    return { dates, rows };
  }, [
    dailyPriceDetailMap,
    dailyPriceHistoryMap,
    priceGapPointsMap,
    selectedHolding,
    today,
  ]);

  if (holdings.length === 0 || !selectedHolding || !analysis) return null;

  const isForeign = isForeignMarket(selectedHolding.market, selectedHolding.ticker);
  const formatPrice = (value) => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "-";
    return isForeign ? `$ ${formatFloat(value)}` : formatNum(value);
  };
  return (
    <section className="mt-5 rounded-3xl border border-cyan-100 bg-gradient-to-br from-slate-950 to-slate-800 p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-[15px] sm:text-[18px] font-black text-white">보유종목 가격 갭 분석</h3>
          <p className="mt-1 text-[11px] sm:text-[12px] font-bold text-slate-300">
            전일 정규장 종가 → 전일 애프터마켓 → 당일 사전장 시초가 → 당일 정규장 시초가 흐름을 비교합니다.
          </p>
        </div>
        <select
          value={selectedHolding.ticker}
          onChange={(event) => setSelectedTicker(event.target.value)}
          className="h-11 rounded-xl border border-cyan-300 bg-white px-3 text-[13px] font-black text-slate-900 outline-none"
        >
          {holdings.map((holding) => (
            <option key={holding.ticker || holding.name} value={holding.ticker}>
              {holding.name}
            </option>
          ))}
        </select>
      </div>
      <div className="-mx-4 mt-4 overflow-x-auto rounded-none border-y border-cyan-400/60 bg-slate-900/80 sm:mx-0 sm:rounded-2xl sm:border">
        <table className="min-w-[590px] table-fixed text-center text-[12px] font-bold text-slate-100 sm:min-w-[720px] sm:w-full">
          <thead className="bg-cyan-500/20 text-cyan-100">
            <tr>
              <th className="sticky left-0 z-20 w-[112px] bg-[#0f4358] px-2 py-3 text-left sm:w-[180px] sm:px-3">항목</th>
              {analysis.dates.map((date) => (
                <th key={date} className="w-[94px] px-1 py-3 sm:px-3">{dateLabel(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(pointLabels).map(([key, label]) => (
              <tr key={key} className="border-t border-cyan-400/20">
                <td className="sticky left-0 z-10 bg-slate-900 px-2 py-3 text-left text-cyan-100 sm:px-3">{label}</td>
                {analysis.dates.map((date) => {
                  const value = analysis.rows[key]?.[date];
                  const base = key === "prevClose" ? null : analysis.rows.prevClose?.[date];
                  const hasValue = Number.isFinite(Number(value)) && Number(value) > 0;
                  const rate = hasValue && base ? formatSignedRate(value, base) : "";
                  return (
                    <td key={`${key}-${date}`} className="px-1 py-3 sm:px-3">
                      <div>{formatPrice(value)}</div>
                      {rate && rate !== "-" && <div className="mt-1 text-[10px] text-slate-400">{rate}</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] font-bold text-slate-400">
        가격 지점은 접속 중 자동 누적됩니다. 새 Supabase SQL 적용 전 또는 과거 미수집 구간은 -로 표시됩니다.
      </p>
    </section>
  );
}

export default function HoldingsTab({
  stats,
  formatNum,
  formatFloat,
  dailyPriceSnapshots,
  liveStockPreviousCloses,
  transactions,
  dailyPriceHistoryMap,
  dailyPriceDetailMap,
  priceGapPointsMap,
  today,
  exchangeRate,
}) {
  const rows = (stats?.holdingList || []).map(holdingView);

  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table min-w-[1180px] text-center whitespace-nowrap">
          <thead className="bg-slate-800 text-white text-[11px] font-black">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-800 w-[110px] sm:w-[170px] px-0 sm:px-1 text-left">종목명</th>
              <th>보유수량</th>
              <th>순투자원금</th>
              <th>평균단가</th>
              <th>현재가</th>
              <th>등락률</th>
              <th>평가금액</th>
              <th>평가손익</th>
              <th>평가수익률</th>
              <th>일수익금</th>
              <th>일수익률</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-bold text-slate-800">
            {rows.map((row) => {
              const isForeign = isForeignMarket(row.market, row.ticker);
              const snapshot = dailyPriceSnapshots?.[row.ticker];
              const latestDate = snapshot?.latestDate || today;
              const savedReferenceClose =
                latestDate === today && snapshot?.previousRegularClose != null
                  ? Number(snapshot.previousRegularClose)
                  : Number(snapshot?.latestRegularClose ?? snapshot?.latestPrice);
              const referenceClose = isForeign
                ? savedReferenceClose
                : Number(liveStockPreviousCloses?.[row.ticker]) || savedReferenceClose;
              const daily = calculateHoldingDailyProfit({
                holding: row,
                transactions,
                today,
                referenceClose,
              });
              const hasReference = daily !== null;
              const dayProfit = hasReference
                ? isForeign
                  ? daily.profit * exchangeRate
                  : daily.profit
                : 0;
              const dayRate = hasReference ? daily.rate : 0;

              return (
                <tr key={row.ticker || row.name} className="h-11 border-b hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white w-[110px] sm:w-[170px] px-0 sm:px-1 text-left">
                    <div className="font-black text-slate-900">{row.name}</div>
                    <div className="text-[10px] text-slate-500">{row.market}:{row.ticker}</div>
                  </td>
                  <td>{formatNum(row.qty)}</td>
                  <td>{formatNum(row.principal)}</td>
                  <td className="text-amber-700">
                    {isForeign ? `$ ${formatFloat(row.avgUsd)}` : formatNum(row.avgKrw)}
                  </td>
                  <td className="text-blue-600">
                    {isForeign ? `$ ${formatFloat(row.currentPrice)}` : formatNum(row.currentPrice)}
                  </td>
                  <td className={hasReference ? (dayRate >= 0 ? "text-rose-500" : "text-blue-500") : "text-amber-600"}>
                    {hasReference ? `${dayRate >= 0 ? "+" : ""}${dayRate.toFixed(2)}%` : "종가 누락"}
                  </td>
                  <td>{formatNum(row.evalAmount)}</td>
                  <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {row.evalProfit >= 0 ? "+" : ""}
                    {formatNum(row.evalProfit)}
                  </td>
                  <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>{row.evalRate}</td>
                  <td className={hasReference ? (dayProfit >= 0 ? "text-rose-500" : "text-blue-500") : "text-amber-600"}>
                    {hasReference ? `${dayProfit >= 0 ? "+" : ""}${formatNum(dayProfit)}` : "-"}
                  </td>
                  <td className={hasReference ? (dayProfit >= 0 ? "text-rose-500" : "text-blue-500") : "text-amber-600"}>
                    {hasReference ? `${dayRate >= 0 ? "+" : ""}${dayRate.toFixed(2)}%` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PriceGapAnalysis
        holdings={rows}
        dailyPriceHistoryMap={dailyPriceHistoryMap}
        dailyPriceDetailMap={dailyPriceDetailMap}
        priceGapPointsMap={priceGapPointsMap}
        today={today}
        formatNum={formatNum}
        formatFloat={formatFloat}
      />
    </>
  );
}
