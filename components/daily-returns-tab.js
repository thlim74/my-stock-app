export default function DailyReturnsTab({ dailyList, formatNum }) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-center border-collapse">
      <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
        <tr>
          <th>날짜</th>
          <th>총 평가자산 (₩)</th>
          <th>누적 투자원금 (₩)</th>
          <th>일일 누적평가손익 (₩)</th>
          <th>총 가동 수익률</th>
        </tr>
      </thead>
      <tbody className="text-[13px] font-bold">
        {[...dailyList]
          .sort((a, b) => b.날짜.localeCompare(a.날짜))
          .map((daily, index) => (
            <tr key={index} className="h-11 border-b hover:bg-slate-50">
              <td className="font-black text-slate-700">{daily.날짜}</td>
              <td className="font-black">₩ {formatNum(daily.평가금액)}</td>
              <td className="text-slate-600">₩ {formatNum(daily.누적원금)}</td>
              <td
                className={
                  daily.일손익 >= 0 ? "text-rose-500" : "text-blue-500"
                }
              >
                {daily.일손익 >= 0 ? "+" : ""}
                {formatNum(daily.일손익)}
              </td>
              <td
                className={`font-black ${daily.일손익 >= 0 ? "text-rose-500" : "text-blue-500"}`}
              >
                {daily.일수익률}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
    </div>
  );
}
