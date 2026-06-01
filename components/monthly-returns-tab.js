const getMonthlyFieldBundle = (row) => {
  const keys = Object.keys(row || {});
  return {
    month: row?.[keys[0]] ?? "",
    startDate: row?.시작일 ?? row?.[keys[1]] ?? "",
    endDate: row?.종료일 ?? row?.[keys[2]] ?? "",
    netInvestment: Number(row?.순투자원금 ?? row?.[keys[3]] ?? 0),
    monthStartAsset: Number(row?.월초평가금액 ?? row?.[keys[8]] ?? 0),
    monthEndAsset: Number(row?.월말평가금액 ?? row?.[keys[4]] ?? 0),
    cashFlow: Number(row?.월간현금흐름 ?? row?.[keys[5]] ?? 0),
    monthProfit: Number(row?.월간손익 ?? row?.[keys[6]] ?? 0),
    monthRate: row?.월간수익률 ?? row?.[keys[7]] ?? "0.00%",
    evalProfit: Number(row?.평가손익 ?? row?.[keys[8]] ?? 0),
  };
};

export default function MonthlyReturnsTab({ monthlyList, formatNum }) {
  const visibleMonthlyList = (monthlyList || [])
    .map((monthly) => getMonthlyFieldBundle(monthly))
    .filter((monthly) => String(monthly.month) >= "2025-11");

  return (
    <div>
      <div className="data-table-wrap">
        <table className="data-table min-w-[1280px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black">
            <tr>
              <th>월별</th>
              <th>시작일</th>
              <th>종료일</th>
              <th>월초평가금액</th>
              <th>월말평가금액</th>
              <th>월간 현금흐름</th>
              <th>월간 손익(보정)</th>
              <th>월간 수익률(보정)</th>
              <th>평가손익</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-bold">
            {visibleMonthlyList.map((monthly) => (
              <tr key={monthly.month} className="h-11 border-b hover:bg-slate-50">
                <td className="font-black text-blue-600">{monthly.month}</td>
                <td>{monthly.startDate}</td>
                <td>{monthly.endDate}</td>
                <td>{formatNum(monthly.monthStartAsset)}</td>
                <td className="font-black text-slate-900">{formatNum(monthly.monthEndAsset)}</td>
                <td className={monthly.cashFlow >= 0 ? "text-slate-700" : "text-blue-500"}>
                  {monthly.cashFlow >= 0 ? "+" : ""}
                  {formatNum(monthly.cashFlow)}
                </td>
                <td className={monthly.monthProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {monthly.monthProfit >= 0 ? "+" : ""}
                  {formatNum(monthly.monthProfit)}
                </td>
                <td className={monthly.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {monthly.monthRate}
                </td>
                <td className={monthly.evalProfit >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {monthly.evalProfit >= 0 ? "+" : ""}
                  {formatNum(monthly.evalProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
