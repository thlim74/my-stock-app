export default function MonthlyReturnsTab({ monthlyList, formatNum }) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full min-w-[700px] text-center border-collapse">
      <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
        <tr>
          <th>해당월</th>
          <th>기말 자산총액</th>
          <th>순 투자원금</th>
          <th>월간 손익총량</th>
          <th>수익률</th>
        </tr>
      </thead>
      <tbody className="text-[13px] font-bold">
        {monthlyList.map((monthly, index) => (
          <tr key={index} className="h-11 border-b hover:bg-slate-50">
            <td className="font-black text-blue-600">{monthly.해당월}</td>
            <td className="font-black">₩ {formatNum(monthly.기말자산)}</td>
            <td className="text-slate-600">₩ {formatNum(monthly.순입출금)}</td>
            <td
              className={
                monthly.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
              }
            >
              {monthly.월간손익 >= 0 ? "+" : ""}
              {formatNum(monthly.월간손익)}
            </td>
            <td
              className={
                monthly.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
              }
            >
              {monthly.수익률}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
