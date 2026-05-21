import { isForeignMarket } from "@/lib/market-utils";

const isForeignHolding = (holding) => isForeignMarket(holding.시장, holding.티커);

export default function HoldingsTab({ stats, formatNum, formatFloat, today }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-center border-collapse">
        <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
          <tr>
            <th>종목명</th>
            <th>티커</th>
            <th>시장구분</th>
            <th>보유수량</th>
            <th>순투자원금</th>
            <th>평균단가</th>
            <th>최신종가</th>
            <th>기준일</th>
            <th>평가금액</th>
            <th>평가손익</th>
            <th>수익률</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {stats.holdingList.map((holding, index) => {
            const isForeign = isForeignHolding(holding);
            return (
              <tr key={index} className="h-12 border-b hover:bg-slate-50">
                <td className="font-black text-blue-600">{holding.종목명}</td>
                <td className="italic text-slate-400">{holding.티커}</td>
                <td>
                  <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {holding.시장}
                  </span>
                </td>
                <td>{formatNum(holding.보유수량)}</td>
                <td className="font-black text-slate-800">{formatNum(holding.순투자원금)}</td>
                <td className="font-mono text-amber-700">
                  {isForeign
                    ? `$ ${formatFloat(holding.평균단가달러기준)}`
                    : formatNum(holding.평균단가)}
                </td>
                <td className="font-mono text-blue-600">
                  {isForeign ? `$ ${formatFloat(holding.현재가)}` : formatNum(holding.현재가)}
                </td>
                <td className="text-slate-500">{today}</td>
                <td className="font-black text-slate-800">{formatNum(holding.평가금액)}</td>
                <td className={holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {holding.손익 >= 0 ? "+" : ""}
                  {formatNum(holding.손익)}
                </td>
                <td className={holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {holding.수익률}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
