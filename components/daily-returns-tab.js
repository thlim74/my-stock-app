const getDailyFieldBundle = (row) => {
  const keys = Object.keys(row || {});
  return {
    date: row?.기준일 ?? row?.[keys[0]] ?? "",
    evalAmount: Number((row?.평가금액 ?? row?.[keys[1]]) || 0),
    cashFlow: Number((row?.당일현금흐름 ?? row?.[keys[2]]) || 0),
    dayProfit: Number((row?.일간손익 ?? row?.[keys[3]]) || 0),
    dayRate: row?.일간수익률 ?? row?.[keys[4]] ?? "0.00%",
    isHoliday: Boolean(row?.휴장 ?? row?.[keys[5]]),
    totalProfit: Number((row?.평가손익 ?? row?.[keys[6]]) || 0),
    totalRate: row?.평가수익률 ?? row?.[keys[7]] ?? "0.00%",
  };
};

const buildPath = (points) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

function DailyProfitChart({ items, formatNum }) {
  const chartItems = [...items]
    .filter(({ f }) => !f.isHoliday)
    .sort((a, b) => String(a.f.date).localeCompare(String(b.f.date)))
    .slice(-22);

  if (chartItems.length === 0) return null;

  const width = 920;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 44, left: 62 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const dayValues = chartItems.map(({ f }) => f.dayProfit);
  const totalValues = chartItems.map(({ f }) => f.totalProfit);
  const dayLimit = Math.max(1, ...dayValues.map((value) => Math.abs(value)));
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
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-[230px] sm:h-[280px]">
          <rect x="0" y="0" width={width} height={height} rx="18" fill="#f8fafc" />
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#cbd5e1"
            strokeDasharray="5 5"
          />
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + plotHeight * ratio}
              x2={width - padding.right}
              y2={padding.top + plotHeight * ratio}
              stroke="#e2e8f0"
            />
          ))}

          {chartItems.map(({ f }, index) => {
            const x = padding.left + barSlot * index + (barSlot - barWidth) / 2;
            const barHeight = (Math.abs(f.dayProfit) / dayLimit) * (plotHeight / 2 - 12);
            const y = f.dayProfit >= 0 ? zeroY - barHeight : zeroY;
            return (
              <g key={f.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="5"
                  fill={f.dayProfit >= 0 ? "#f43f5e" : "#2563eb"}
                  opacity="0.86"
                />
                <text
                  x={padding.left + barSlot * index + barSlot / 2}
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

          <text x="18" y={padding.top + 4} fontSize="11" fontWeight="900" fill="#64748b">
            +{formatNum(dayLimit)}
          </text>
          <text x="24" y={zeroY + 4} fontSize="11" fontWeight="900" fill="#64748b">
            0
          </text>
          <text x="18" y={padding.top + plotHeight} fontSize="11" fontWeight="900" fill="#64748b">
            -{formatNum(dayLimit)}
          </text>
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
