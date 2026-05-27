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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
          <div
            key={holding.티커 || holding.종목명}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[16px] font-black text-slate-900">{holding.종목명}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                  {holding.시장} · {holding.티커}
                </div>
              </div>
              <span className="text-[11px] font-black rounded-full px-2 py-1 bg-slate-100 text-slate-600">
                수량 {formatNum(holding.보유수량)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-bold">
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">순투자원금</div>
                <div className="text-slate-800 mt-0.5">{formatNum(holding.순투자원금)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">평균단가</div>
                <div className="text-slate-800 mt-0.5">
                  {isForeign ? `$ ${formatFloat(holding.평균단가_달러기준)}` : formatNum(holding.평균단가)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">현재가</div>
                <div className="text-blue-600 mt-0.5 font-black">
                  {isForeign ? `$ ${formatFloat(holding.현재가)}` : formatNum(holding.현재가)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">등락률</div>
                <div className={`mt-0.5 font-black ${dayRate >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                  {dayRate >= 0 ? "+" : ""}
                  {dayRate.toFixed(2)}%
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">평가금액</div>
                <div className="text-slate-800 mt-0.5 font-black">{formatNum(holding.평가금액)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">평가손익률</div>
                <div className={`mt-0.5 font-black ${holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                  {holding.수익률}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">평가손익</div>
                <div className={`mt-0.5 font-black ${holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                  {holding.손익 >= 0 ? "+" : ""}
                  {formatNum(holding.손익)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-slate-400">일수익금/일수익률</div>
                <div className={`mt-0.5 font-black ${dayProfit >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                  {dayProfit >= 0 ? "+" : ""}
                  {formatNum(dayProfit)} / {dayRate >= 0 ? "+" : ""}
                  {dayRate.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
