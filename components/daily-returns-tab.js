"use client";

import { useState } from "react";

const getDailyFieldBundle = (row) => {
  const keys = Object.keys(row || {});
  return {
    date: row?.[keys[0]] ?? "",
    evalAmount: Number(row?.[keys[1]] || 0),
    cashFlow: Number(row?.[keys[2]] || 0),
    dayProfit: Number(row?.[keys[3]] || 0),
    dayRate: row?.[keys[4]] ?? "0.00%",
    isHoliday: Boolean(row?.[keys[5]]),
    totalRate: row?.[keys[6]] ?? "0.00%",
    totalProfit: Number(row?.[keys[7]] || 0),
  };
};

const buildPath = (points) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

const getAxisStep = (limit) => {
  if (limit <= 4_000_000) return 1_000_000;
  if (limit <= 10_000_000) return 2_000_000;
  if (limit <= 25_000_000) return 5_000_000;
  return 10_000_000;
};

const formatAxisLabel = (value) => {
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value) / 10_000}만`;
};

function DailyProfitChart({ items, formatNum }) {
  const [activePoint, setActivePoint] = useState(null);
  const chartItems = [...items]
    .filter(({ f }) => !f.isHoliday)
    .sort((a, b) => String(a.f.date).localeCompare(String(b.f.date)))
    .slice(-22);

  if (chartItems.length === 0) return null;

  const width = 920;
  const height = 300;
  const padding = { top: 28, right: 24, bottom: 48, left: 74 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const dayValues = chartItems.map(({ f }) => f.dayProfit);
  const totalValues = chartItems.map(({ f }) => f.totalProfit);
  const rawDayLimit = Math.max(1, ...dayValues.map((value) => Math.abs(value)));
  const axisStep = getAxisStep(rawDayLimit);
  const dayLimit = Math.max(axisStep, Math.ceil(rawDayLimit / axisStep) * axisStep);
  const axisValues = [];
  for (let value = dayLimit; value >= -dayLimit; value -= axisStep) {
    axisValues.push(value);
  }

  const totalMin = Math.min(...totalValues);
  const totalMax = Math.max(...totalValues);
  const totalRange = Math.max(1, totalMax - totalMin);
  const zeroY = padding.top + plotHeight / 2;
  const barSlot = plotWidth / chartItems.length;
  const barWidth = Math.max(10, Math.min(28, barSlot * 0.5));
  const linePoints = chartItems.map(({ f }, index) => ({
    x: padding.left + barSlot * index + barSlot / 2,
    y: padding.top + ((totalMax - f.totalProfit) / totalRange) * plotHeight,
  }));

  const getProfitY = (value) => zeroY - (value / dayLimit) * (plotHeight / 2);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-[14px] sm:text-[16px] font-black text-slate-900">
            일별 수익 추이
          </h3>
          <p className="text-[11px] sm:text-[12px] font-bold text-slate-500">
            최근 {chartItems.length}거래일 기준, 막대는 일간손익 / 선은 평가손익입니다.
          </p>
        </div>
        <div className="flex gap-3 text-[11px] font-black">
          <span className="text-slate-500">막대: 일간손익</span>
          <span className="text-emerald-600">선: 평가손익</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px] w-full h-[250px] sm:h-[300px]"
          onMouseLeave={() => setActivePoint(null)}
        >
          <rect x="0" y="0" width={width} height={height} rx="18" fill="#f8fafc" />

          {axisValues.map((value) => {
            const y = getProfitY(value);
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={value === 0 ? "#cbd5e1" : "#e2e8f0"}
                  strokeDasharray={value === 0 ? "5 5" : "none"}
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="900"
                  fill="#64748b"
                >
                  {formatAxisLabel(value)}
                </text>
              </g>
            );
          })}

          {chartItems.map(({ f }, index) => {
            const centerX = padding.left + barSlot * index + barSlot / 2;
            const x = centerX - barWidth / 2;
            const barHeight = (Math.abs(f.dayProfit) / dayLimit) * (plotHeight / 2);
            const y = f.dayProfit >= 0 ? zeroY - barHeight : zeroY;
            const point = {
              x: centerX,
              y,
              date: f.date,
              dayProfit: f.dayProfit,
              dayRate: f.dayRate,
              totalProfit: f.totalProfit,
            };
            return (
              <g
                key={f.date}
                onMouseEnter={() => setActivePoint(point)}
                onClick={() => setActivePoint(point)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="5"
                  fill={f.dayProfit >= 0 ? "#f43f5e" : "#2563eb"}
                  opacity={activePoint?.date === f.date ? "1" : "0.86"}
                />
                <text
                  x={centerX}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#64748b"
                >
                  {String(f.date).slice(5)}
                </text>
              </g>
            );
          })}

          <path
            d={buildPath(linePoints)}
            fill="none"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {linePoints.map((point, index) => (
            <circle key={chartItems[index].f.date} cx={point.x} cy={point.y} r="4" fill="#059669" />
          ))}

          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
              <rect
                x={Math.min(activePoint.x + 12, width - 226)}
                y={Math.max(14, activePoint.y - 66)}
                width="214"
                height="74"
                rx="12"
                fill="#0f172a"
                opacity="0.94"
              />
              <text
                x={Math.min(activePoint.x + 26, width - 212)}
                y={Math.max(38, activePoint.y - 42)}
                fontSize="12"
                fontWeight="900"
                fill="#ffffff"
              >
                {activePoint.date}
              </text>
              <text
                x={Math.min(activePoint.x + 26, width - 212)}
                y={Math.max(58, activePoint.y - 22)}
                fontSize="12"
                fontWeight="900"
                fill={activePoint.dayProfit >= 0 ? "#fb7185" : "#60a5fa"}
              >
                일간손익: {activePoint.dayProfit >= 0 ? "+" : ""}
                {formatNum(activePoint.dayProfit)} ({activePoint.dayRate})
              </text>
              <text
                x={Math.min(activePoint.x + 26, width - 212)}
                y={Math.max(78, activePoint.y - 2)}
                fontSize="12"
                fontWeight="900"
                fill="#34d399"
              >
                평가손익: {activePoint.totalProfit >= 0 ? "+" : ""}
                {formatNum(activePoint.totalProfit)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export default function DailyReturnsTab({ dailyList, formatNum }) {
  const enriched = (dailyList || [])
    .map((row) => ({ row, f: getDailyFieldBundle(row) }))
    .filter(({ f }) => String(f.date) >= "2025-11-01");
  const sortedList = [...enriched].sort((a, b) => String(b.f.date).localeCompare(String(a.f.date)));
  const latestDate = sortedList[0]?.f.date || "";

  return (
    <div>
      <DailyProfitChart items={sortedList} formatNum={formatNum} />

      <div className="data-table-wrap">
        <table className="data-table min-w-[980px] sm:min-w-[1120px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black">
            <tr>
              <th className="w-[116px] sm:w-[170px] px-0 sm:px-2">기준일</th>
              <th className="w-[44px] sm:w-[76px] px-0 sm:px-2">기준</th>
              <th>평가금액</th>
              <th>당일 현금흐름</th>
              <th>일간 손익</th>
              <th>일간 수익률</th>
              <th>평가손익</th>
              <th>평가수익률</th>
            </tr>
          </thead>
          <tbody className="text-[12px] sm:text-[13px] font-bold">
            {sortedList.map(({ f }) => (
              <tr key={String(f.date)} className="h-11 border-b hover:bg-slate-50">
                <td className="w-[116px] sm:w-[170px] px-0 sm:px-2 font-black text-slate-700 whitespace-nowrap">
                  {f.date}
                  {f.isHoliday ? " (휴장)" : ""}
                </td>
                <td className="w-[44px] sm:w-[76px] px-0 sm:px-2 text-slate-700 whitespace-nowrap">
                  {f.date === latestDate ? "실시간" : "종가"}
                </td>
                <td className="font-black text-slate-900">{formatNum(f.evalAmount)}</td>
                <td className={f.cashFlow >= 0 ? "text-slate-700" : "text-blue-500"}>
                  {f.cashFlow >= 0 ? "+" : ""}
                  {formatNum(f.cashFlow)}
                </td>
                <td className={f.dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {f.dayProfit >= 0 ? "+" : ""}
                  {formatNum(f.dayProfit)}
                </td>
                <td className={f.dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}>{f.dayRate}</td>
                <td className={f.totalProfit >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {f.totalProfit >= 0 ? "+" : ""}
                  {formatNum(f.totalProfit)}
                </td>
                <td className={f.totalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>{f.totalRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
