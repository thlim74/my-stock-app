export default function DailyReturnsTab({ dailyList, formatNum, afterMarketMetrics }) {
  const sortedList = [...dailyList].sort((a, b) => b.기준일.localeCompare(a.기준일));
  const latestDate = sortedList[0]?.기준일 || "";

  return (
    <div>
      {afterMarketMetrics && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold">
          <span className="text-slate-700">공식(정규장) 기준 성과는 표 데이터로 유지됩니다.</span>
          <span className={`ml-2 ${afterMarketMetrics.deltaProfitAmount >= 0 ? "text-rose-500" : "text-blue-500"}`}>
            참고(애프터) 손익 변화: {afterMarketMetrics.deltaProfitAmount >= 0 ? "+" : ""}
            {formatNum(afterMarketMetrics.deltaProfitAmount)}
          </span>
        </div>
      )}
      <div className="data-table-wrap">
        <table className="data-table min-w-[1120px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black">
            <tr>
              <th>기준일</th>
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
            {sortedList.map((daily) => (
              <tr key={daily.기준일} className="h-11 border-b hover:bg-slate-50">
                <td className="font-black text-slate-700">
                  {daily.기준일}
                  {daily.휴장여부 ? " (휴장)" : ""}
                </td>
                <td className="text-slate-700">{daily.기준일 === latestDate ? "실시간" : "종가"}</td>
                <td className="font-black text-slate-900">{formatNum(daily.평가금액)}</td>
                <td className={daily.당일현금흐름 >= 0 ? "text-slate-700" : "text-blue-500"}>
                  {daily.당일현금흐름 >= 0 ? "+" : ""}
                  {formatNum(daily.당일현금흐름)}
                </td>
                <td className={daily.일간손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {daily.일간손익 >= 0 ? "+" : ""}
                  {formatNum(daily.일간손익)}
                </td>
                <td className={daily.일간손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {daily.일간수익률}
                </td>
                <td className={daily.평가손익 >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {daily.평가손익 >= 0 ? "+" : ""}
                  {formatNum(daily.평가손익)}
                </td>
                <td className={daily.평가손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {daily.수익률}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

