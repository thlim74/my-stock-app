import { isForeignMarket } from "@/lib/market-utils";

const findFirst = (obj, keys, fallback = undefined) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) {
      return obj[key];
    }
  }
  return fallback;
};

const toNumber = (value) => Number(value) || 0;

const holdingView = (holding) => ({
  name: String(findFirst(holding, ["종목명"], "")),
  ticker: String(findFirst(holding, ["티커"], "")),
  market: String(findFirst(holding, ["시장"], "KOSPI")),
  qty: toNumber(findFirst(holding, ["보유수량"], 0)),
  principal: toNumber(findFirst(holding, ["순투자원금"], 0)),
  avgKrw: toNumber(findFirst(holding, ["평균단가"], 0)),
  avgUsd: toNumber(findFirst(holding, ["평균단가_달러기준"], 0)),
  currentPrice: toNumber(findFirst(holding, ["현재가"], 0)),
  evalAmount: toNumber(findFirst(holding, ["평가금액"], 0)),
  evalProfit: toNumber(findFirst(holding, ["손익"], 0)),
  evalRate: String(findFirst(holding, ["수익률"], "0.00%")),
});

export default function HoldingsTab({
  stats,
  formatNum,
  formatFloat,
  dailyPriceSnapshots,
  today,
  exchangeRate,
}) {
  const rows = (stats?.holdingList || []).map(holdingView);

  return (
    <div className="data-table-wrap">
      <table className="data-table min-w-[1180px] text-center whitespace-nowrap">
        <thead className="bg-slate-800 text-white text-[11px] font-black">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-800 w-[110px] sm:w-[170px] px-0 sm:px-1 text-left">종목명</th>
            <th>보유수량</th>
            <th>순투자원금</th>
            <th>평균단가</th>
            <th>현재가</th>
            <th>등락률</th>
            <th>평가금액</th>
            <th>평가손익</th>
            <th>평가수익률</th>
            <th>일수익금</th>
            <th>일수익률</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold text-slate-800">
          {rows.map((row) => {
            const isForeign = isForeignMarket(row.market, row.ticker);
            const snapshot = dailyPriceSnapshots?.[row.ticker];
            const latestDate = snapshot?.latestDate || today;
            const referenceClose =
              latestDate === today && snapshot?.previousPrice != null
                ? Number(snapshot.previousPrice)
                : Number(snapshot?.latestPrice);
            const hasReference = Number.isFinite(referenceClose) && referenceClose > 0;

            const dayProfit = hasReference
              ? isForeign
                ? (row.currentPrice - referenceClose) * row.qty * exchangeRate
                : (row.currentPrice - referenceClose) * row.qty
              : 0;
            const dayRate = hasReference ? ((row.currentPrice - referenceClose) / referenceClose) * 100 : 0;

            return (
              <tr key={row.ticker || row.name} className="h-11 border-b hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white w-[110px] sm:w-[170px] px-0 sm:px-1 text-left">
                  <div className="font-black text-slate-900">{row.name}</div>
                  <div className="text-[10px] text-slate-500">{row.market}:{row.ticker}</div>
                </td>
                <td>{formatNum(row.qty)}</td>
                <td>{formatNum(row.principal)}</td>
                <td className="text-amber-700">
                  {isForeign ? `$ ${formatFloat(row.avgUsd)}` : formatNum(row.avgKrw)}
                </td>
                <td className="text-blue-600">
                  {isForeign ? `$ ${formatFloat(row.currentPrice)}` : formatNum(row.currentPrice)}
                </td>
                <td className={dayRate >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {dayRate >= 0 ? "+" : ""}
                  {dayRate.toFixed(2)}%
                </td>
                <td>{formatNum(row.evalAmount)}</td>
                <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>
                  {row.evalProfit >= 0 ? "+" : ""}
                  {formatNum(row.evalProfit)}
                </td>
                <td className={row.evalProfit >= 0 ? "text-rose-500" : "text-blue-500"}>{row.evalRate}</td>
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
