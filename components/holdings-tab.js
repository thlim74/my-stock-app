"use client";

import { useMemo, useState } from "react";
import { isForeignMarket } from "@/lib/market-utils";

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

const formatSignedRate = (current, base) => {
  if (!Number.isFinite(current) || !Number.isFinite(base) || base <= 0) return "-";
  const rate = ((current - base) / base) * 100;
  return `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
};

const buildPath = (points) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

function PriceGapChart({ dates, rows, selectedName, formatPrice }) {
  const [activePoint, setActivePoint] = useState(null);
  const flatPoints = dates.flatMap((date) =>
    ["prevClose", "prevAfter", "preOpen", "regularOpen"].map((key) => ({
      date,
      key,
      label: pointLabels[key],
      value: rows[key]?.[date],
    })),
  );
  const validPoints = flatPoints.filter((point) => Number.isFinite(point.value) && point.value > 0);

  if (validPoints.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-[12px] font-bold text-slate-500">
        가격 갭 분석에 필요한 가격 포인트가 아직 부족합니다. 현재 저장된 정규장 종가부터 표시되며,
        애프터/사전장/시초가 저장 구조가 추가되면 그래프가 자동 확장됩니다.
      </div>
    );
  }

  const width = 980;
  const height = 310;
  const padding = { top: 24, right: 28, bottom: 70, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const minValue = Math.min(...validPoints.map((point) => point.value));
  const maxValue = Math.max(...validPoints.map((point) => point.value));
  const range = Math.max(1, maxValue - minValue);
  const slot = plotWidth / Math.max(1, flatPoints.length - 1);
  const chartPoints = flatPoints
    .map((point, index) => {
      if (!Number.isFinite(point.value) || point.value <= 0) return null;
      return {
        ...point,
        x: padding.left + slot * index,
        y: padding.top + ((maxValue - point.value) / range) * plotHeight,
      };
    })
    .filter(Boolean);
  const axisValues = [maxValue, minValue + range / 2, minValue];

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[760px] w-full h-[280px] sm:h-[310px]"
        onMouseLeave={() => setActivePoint(null)}
      >
        <rect x="0" y="0" width={width} height={height} rx="18" fill="#0f172a" />
        <rect x="12" y="12" width={width - 24} height={height - 24} rx="16" fill="#172033" />

        {axisValues.map((value) => {
          const y = padding.top + ((maxValue - value) / range) * plotHeight;
          return (
            <g key={value}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#334155" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="11" fontWeight="900" fill="#cbd5e1">
                {formatPrice(value)}
              </text>
            </g>
          );
        })}

        {dates.map((date, dateIndex) => {
          const x = padding.left + slot * (dateIndex * 4 + 1.5);
          return (
            <g key={date}>
              <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom + 18} stroke="#263449" />
              <text x={x} y={height - 24} textAnchor="middle" fontSize="13" fontWeight="900" fill="#e2e8f0">
                {dateLabel(date)}
              </text>
            </g>
          );
        })}

        <path
          d={buildPath(chartPoints)}
          fill="none"
          stroke="#67e8f9"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chartPoints.map((point) => (
          <g
            key={`${point.date}-${point.key}`}
            className="cursor-pointer"
            onMouseEnter={() => setActivePoint(point)}
            onClick={() => setActivePoint(point)}
          >
            <circle cx={point.x} cy={point.y} r="5" fill="#67e8f9" stroke="#0f172a" strokeWidth="2" />
            <text
              x={point.x}
              y={height - 48}
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#cbd5e1"
            >
              {point.label.replace(" ", "\n").slice(0, 8)}
            </text>
          </g>
        ))}

        {activePoint && (
          <g>
            <line x1={activePoint.x} y1={padding.top} x2={activePoint.x} y2={height - padding.bottom} stroke="#94a3b8" strokeDasharray="4 4" />
            <rect x={Math.min(activePoint.x + 12, width - 276)} y={Math.max(18, activePoint.y - 62)} width="264" height="76" rx="12" fill="#020617" opacity="0.95" />
            <text x={Math.min(activePoint.x + 26, width - 262)} y={Math.max(42, activePoint.y - 36)} fontSize="12" fontWeight="900" fill="#ffffff">
              {selectedName} · {activePoint.date}
            </text>
            <text x={Math.min(activePoint.x + 26, width - 262)} y={Math.max(62, activePoint.y - 16)} fontSize="12" fontWeight="900" fill="#67e8f9">
              {activePoint.label}: {formatPrice(activePoint.value)}
            </text>
            <text x={Math.min(activePoint.x + 26, width - 262)} y={Math.max(82, activePoint.y + 4)} fontSize="11" fontWeight="800" fill="#cbd5e1">
              전 지점 대비 {formatSignedRate(activePoint.value, chartPoints[chartPoints.indexOf(activePoint) - 1]?.value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function PriceGapAnalysis({
  holdings,
  dailyPriceHistoryMap,
  dailyPriceSnapshots,
  afterHoursPrices,
  afterHoursStatus,
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
    const dates = Object.keys(history)
      .filter((date) => date <= today)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5)
      .sort((a, b) => a.localeCompare(b));
    const rows = {
      prevClose: {},
      prevAfter: {},
      preOpen: {},
      regularOpen: {},
    };

    dates.forEach((date) => {
      const previousDate = Object.keys(history)
        .filter((itemDate) => itemDate < date)
        .sort((a, b) => b.localeCompare(a))[0];
      rows.prevClose[date] = previousDate ? Number(history[previousDate]) : null;
    });

    const latestDate = dailyPriceSnapshots?.[selectedHolding.ticker]?.latestDate;
    if (latestDate && dates.includes(latestDate)) {
      const afterPrice = Number(afterHoursPrices?.[selectedHolding.ticker]);
      const source = afterHoursStatus?.[selectedHolding.ticker]?.source;
      const isAfterSource = source === "post" || source === "pre" || source === "naver_after";
      rows.prevAfter[latestDate] = isAfterSource && Number.isFinite(afterPrice) ? afterPrice : null;
    }

    return { dates, rows };
  }, [afterHoursPrices, afterHoursStatus, dailyPriceHistoryMap, dailyPriceSnapshots, selectedHolding, today]);

  if (holdings.length === 0 || !selectedHolding || !analysis) return null;

  const isForeign = isForeignMarket(selectedHolding.market, selectedHolding.ticker);
  const formatPrice = (value) => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "-";
    return isForeign ? `$ ${formatFloat(value)}` : formatNum(value);
  };
  const selectedName = selectedHolding.name || selectedHolding.ticker;

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

      <PriceGapChart
        dates={analysis.dates}
        rows={analysis.rows}
        selectedName={selectedName}
        formatPrice={formatPrice}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-cyan-400/60 bg-slate-900/80">
        <table className="min-w-[720px] w-full text-center text-[12px] font-bold text-slate-100">
          <thead className="bg-cyan-500/20 text-cyan-100">
            <tr>
              <th className="w-[180px] px-3 py-3 text-left">항목</th>
              {analysis.dates.map((date) => (
                <th key={date} className="px-3 py-3">{dateLabel(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(pointLabels).map(([key, label]) => (
              <tr key={key} className="border-t border-cyan-400/20">
                <td className="px-3 py-3 text-left text-cyan-100">{label}</td>
                {analysis.dates.map((date) => {
                  const value = analysis.rows[key]?.[date];
                  const base = key === "prevClose" ? null : analysis.rows.prevClose?.[date];
                  const rate = base ? formatSignedRate(Number(value), Number(base)) : "";
                  return (
                    <td key={`${key}-${date}`} className="px-3 py-3">
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
        현재 과거 애프터/사전장/시초가는 DB에 별도 저장되지 않아 미수집 구간은 -로 표시됩니다.
      </p>
    </section>
  );
}

export default function HoldingsTab({
  stats,
  formatNum,
  formatFloat,
  dailyPriceSnapshots,
  dailyPriceHistoryMap,
  liveStockPrices,
  afterHoursPrices,
  afterHoursStatus,
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
              const referenceClose =
                latestDate === today && snapshot?.previousPrice != null
                  ? Number(snapshot.previousPrice)
                  : Number(snapshot?.latestPrice);
              const hasReference = Number.isFinite(referenceClose) && referenceClose > 0;

              const dayProfit = hasReference
                ? isForeign
                  ? (row.currentPrice - referenceClose) * row.qty * exchangeRate
                  : (row.currentPrice - referenceClose) * row.qty
                : 0;
              const dayRate = hasReference ? ((row.currentPrice - referenceClose) / referenceClose) * 100 : 0;

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
                  <td className={dayRate >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {dayRate >= 0 ? "+" : ""}
                    {dayRate.toFixed(2)}%
                  </td>
                  <td>{formatNum(row.evalAmount)}</td>
                  <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {row.evalProfit >= 0 ? "+" : ""}
                    {formatNum(row.evalProfit)}
                  </td>
                  <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>{row.evalRate}</td>
                  <td className={dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {dayProfit >= 0 ? "+" : ""}
                    {formatNum(dayProfit)}
                  </td>
                  <td className={dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {dayRate >= 0 ? "+" : ""}
                    {dayRate.toFixed(2)}%
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
        dailyPriceSnapshots={dailyPriceSnapshots}
        liveStockPrices={liveStockPrices}
        afterHoursPrices={afterHoursPrices}
        afterHoursStatus={afterHoursStatus}
        today={today}
        formatNum={formatNum}
        formatFloat={formatFloat}
      />
    </>
  );
}
