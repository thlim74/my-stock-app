export default function MonthlyReturnsTab({ monthlyList, formatNum }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table min-w-[1100px] text-center">
        <thead className="bg-slate-800 text-white text-[11px] font-black">
          <tr>
            <th>월별</th>
            <th>순투자원금</th>
            <th>월말평가금액</th>
            <th>월간현금흐름</th>
            <th>월간손익</th>
            <th>월간수익률</th>
            <th>평가손익</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {monthlyList.map((monthly, index) => (
            <tr key={index} className="h-11 border-b hover:bg-slate-50">
              <td className="font-black text-blue-600">{monthly.월별}</td>
              <td className="font-black text-slate-800">{formatNum(monthly.순투자원금)}</td>
              <td className="font-black text-slate-900">{formatNum(monthly.월말평가금액)}</td>
              <td className={monthly.월간현금흐름 >= 0 ? "text-slate-700" : "text-blue-500"}>
                {monthly.월간현금흐름 >= 0 ? "+" : ""}
                {formatNum(monthly.월간현금흐름)}
              </td>
              <td className={monthly.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                {monthly.월간손익 >= 0 ? "+" : ""}
                {formatNum(monthly.월간손익)}
              </td>
              <td className={monthly.평가손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                {monthly.월간수익률}
              </td>
              <td className={monthly.평가손익 >= 0 ? "text-emerald-600" : "text-rose-500"}>
                {monthly.평가손익 >= 0 ? "+" : ""}
                {formatNum(monthly.평가손익)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
