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

export default function DailyReturnsTab({ dailyList, formatNum }) {
  const enriched = (dailyList || []).map((row) => ({ row, f: getDailyFieldBundle(row) }));
  const sortedList = [...enriched].sort((a, b) => String(b.f.date).localeCompare(String(a.f.date)));
  const latestDate = sortedList[0]?.f.date || "";

  return (
    <div className="data-table-wrap">
      <table className="data-table min-w-[1120px] text-center">
        <thead className="bg-slate-800 text-white text-[11px] font-black">
          <tr>
            <th className="px-2 sm:px-3">기준일</th>
            <th>기준</th>
            <th>평가금액</th>
            <th>당일 현금흐름</th>
            <th>일간 손익</th>
            <th>일간 수익률</th>
            <th>평가손익</th>
            <th>평가수익률</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {sortedList.map(({ row, f }) => (
            <tr key={String(f.date)} className="h-11 border-b hover:bg-slate-50">
              <td className="px-2 sm:px-3 font-black text-slate-700">
                {f.date}
                {f.isHoliday ? " (휴장)" : ""}
              </td>
              <td className="text-slate-700">{f.date === latestDate ? "실시간" : "종가"}</td>
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
  );
}
