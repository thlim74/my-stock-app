"use client";

import { isForeignMarket } from "@/lib/market-utils";

const formatValue = (value, market) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (market === "TSE") {
    return `¥ ${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return isForeignMarket(market)
    ? `$ ${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : `${Math.round(number).toLocaleString()}원`;
};

const rateText = (price, previousClose) => {
  const current = Number(price);
  const previous = Number(previousClose);
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return "-";
  const rate = ((current - previous) / previous) * 100;
  return `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
};

export default function WatchlistTab({
  watchlist,
  newWatch,
  setNewWatch,
  onAdd,
  onRemove,
  onMove,
  onTickerBlur,
  onNameChange,
  stockMaster,
  liveStockPrices,
  liveStockPreviousCloses,
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-slate-950 to-cyan-950 p-4 text-white shadow-sm sm:p-5">
        <p className="text-[11px] font-black tracking-[0.18em] text-cyan-300">WATCHLIST</p>
        <h2 className="mt-1 text-lg font-black sm:text-xl">관심종목</h2>
        <p className="mt-1 text-[11px] font-bold text-slate-300">보유 여부와 관계없이 등록한 종목의 시세를 확인합니다.</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
          <input
            value={newWatch.ticker}
            onChange={(event) => setNewWatch({ ...newWatch, ticker: event.target.value.toUpperCase() })}
            onBlur={onTickerBlur}
            onKeyDown={(event) => event.key === "Enter" && onAdd()}
            placeholder="티커: 005930, MSFT, 9984"
            className="h-11 rounded-xl border border-white/20 bg-white px-3 text-[12px] font-black text-slate-900 outline-none"
          />
          <input
            value={newWatch.name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onAdd()}
            list="watchlist-stock-names"
            placeholder="종목명으로도 검색 가능"
            className="h-11 rounded-xl border border-white/20 bg-white px-3 text-[12px] font-black text-slate-900 outline-none"
          />
          <datalist id="watchlist-stock-names">
            {stockMaster.map((stock) => (
              <option key={stock.티커} value={stock.종목명} />
            ))}
          </datalist>
          <select
            value={newWatch.market}
            onChange={(event) => setNewWatch({ ...newWatch, market: event.target.value })}
            className="h-11 rounded-xl border border-white/20 bg-white px-3 text-[12px] font-black text-slate-900 outline-none"
          >
            <option>KOSPI</option>
            <option>KOSDAQ</option>
            <option>NASDAQ</option>
            <option>NYSE</option>
            <option>AMEX</option>
            <option>TSE</option>
          </select>
          <button onClick={onAdd} className="h-11 rounded-xl bg-cyan-400 px-4 text-[12px] font-black text-slate-950 hover:bg-cyan-300">
            추가
          </button>
        </div>
      </section>

      {watchlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-400">
          관심 종목을 추가하면 실시간 시세를 여기에서 확인할 수 있습니다.
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <h3 className="text-lg font-black tracking-tight text-slate-900">관심 시세</h3>
          </div>
          <div className="divide-y divide-slate-200 px-4">
            {watchlist.map((stock, index) => {
              const price = liveStockPrices[stock.ticker];
              const previousClose = liveStockPreviousCloses[stock.ticker];
              const rate = rateText(price, previousClose);
              const priceAvailable = Number.isFinite(Number(price));
              const positive = Number(price) >= Number(previousClose);

              return (
                <article key={stock.id} className="flex min-h-14 items-center justify-between gap-3 py-2.5">
                  <p className="min-w-0 break-keep text-[14px] font-black tracking-tight text-slate-900 sm:text-base">{stock.name || stock.ticker}</p>
                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <div>
                      <p className="whitespace-nowrap text-[14px] font-black text-slate-800 sm:text-[15px]">{formatValue(price, stock.market)}</p>
                      <p className={`mt-0.5 text-[10px] font-black ${!priceAvailable ? "text-slate-400" : positive ? "text-rose-500" : "text-blue-500"}`}>{rate}</p>
                    </div>
                    <div className="flex flex-col text-[10px] font-black">
                      <button onClick={() => onMove(stock.id, -1)} disabled={index === 0} className="text-slate-500 hover:text-slate-900 disabled:opacity-20">위</button>
                      <button onClick={() => onMove(stock.id, 1)} disabled={index === watchlist.length - 1} className="text-slate-500 hover:text-slate-900 disabled:opacity-20">아래</button>
                    </div>
                    <button onClick={() => onRemove(stock.id)} className="ml-2 min-h-8 border-l border-slate-200 pl-3 text-[10px] font-black text-rose-500 hover:text-rose-600">삭제</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
