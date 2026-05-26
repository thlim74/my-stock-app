import { isForeignMarket } from "@/lib/market-utils";

const isForeignHolding = (holding) => isForeignMarket(holding.시장, holding.티커);

export default function HoldingsTab({
  stats,
  formatNum,
  formatFloat,
  dailyPriceSnapshots,
  today,
  exchangeRate,
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table min-w-[1320px] text-center">
        <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
          <tr>
            <th>종목명</th>
            <th>시장구분</th>
            <th>보유수량</th>
            <th>순투자원금</th>
            <th>평균단가</th>
            <th>최신종가</th>
            <th>등락률</th>
            <th>평가금액</th>
            <th>평가손익</th>
            <th>평가수익률</th>
            <th>일수익금</th>
            <th>일수익률</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {stats.holdingList.map((holding) => {
            const isForeign = isForeignHolding(holding);
            const snapshot = dailyPriceSnapshots?.[holding.티커];
            const latestDate = snapshot?.latestDate || today;
            const referenceClose =
              latestDate === today && snapshot?.previousPrice != null
                ? snapshot.previousPrice
                : snapshot?.latestPrice ?? null;
            const dayProfit =
              referenceClose != null
                ? isForeign
                  ? (holding.현재가 - referenceClose) * holding.보유수량 * exchangeRate
                  : (holding.현재가 - referenceClose) * holding.보유수량
                : 0;
            const dayRate =
              referenceClose != null && referenceClose > 0
                ? ((holding.현재가 - referenceClose) / referenceClose) * 100
                : 0;

            return (
              <tr key={holding.종목명} className="h-12 border-b hover:bg-slate-50">
                <td className="font-black text-blue-600">{holding.종목명}</td>
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
                <td className={dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {dayRate >= 0 ? "+" : ""}
                  {dayRate.toFixed(2)}%
                </td>
                <td className="font-black text-slate-800">{formatNum(holding.평가금액)}</td>
                <td className={holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {holding.손익 >= 0 ? "+" : ""}
                  {formatNum(holding.손익)}
                </td>
                <td className={holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {holding.수익률}
                </td>
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
  );
}
