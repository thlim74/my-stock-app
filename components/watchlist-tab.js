"use client";

import { isForeignMarket } from "@/lib/market-utils";

const formatValue = (value, foreign) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return foreign
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
  onTickerBlur,
  onNameChange,
  stockMaster,
  liveStockPrices,
  liveStockPreviousCloses,
  afterHoursPrices,
  livePriceStatus,
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-slate-950 to-cyan-950 p-4 text-white shadow-sm sm:p-5">
        <p className="text-[11px] font-black tracking-[0.18em] text-cyan-300">WATCHLIST</p>
        <h2 className="mt-1 text-lg font-black sm:text-xl">관심종목</h2>
        <p className="mt-1 text-[11px] font-bold text-slate-300">보유 여부와 관계없이 등록한 종목의 시세를 확인합니다.</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
          <input
            value={newWatch.ticker}
            onChange={(event) => setNewWatch({ ...newWatch, ticker: event.target.value.toUpperCase() })}
            onBlur={onTickerBlur}
            onKeyDown={(event) => event.key === "Enter" && onAdd()}
            placeholder="티커: 005930, MSFT"
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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-black text-slate-800">관심 시세</h3>
          </div>
          <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
            {watchlist.map((stock) => {
              const foreign = isForeignMarket(stock.market, stock.ticker);
              const price = liveStockPrices[stock.ticker];
              const previousClose = liveStockPreviousCloses[stock.ticker];
              const afterPrice = afterHoursPrices[stock.ticker];
              const rate = rateText(price, previousClose);
              const positive = Number(price) >= Number(previousClose);

              return (
                <article key={stock.id} className="bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{stock.name || stock.ticker}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-400">{stock.market} · {stock.ticker}</p>
                    </div>
                    <button onClick={() => onRemove(stock.id)} className="text-[11px] font-black text-rose-500 hover:underline">삭제</button>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">현재가</p>
                      <p className="mt-1 text-xl font-black text-slate-800">{formatValue(price, foreign)}</p>
                    </div>
                    <p className={`text-sm font-black ${positive ? "text-rose-500" : "text-blue-600"}`}>{rate}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400">
                    <span>{livePriceStatus[stock.ticker]?.message || "시세 확인 중"}</span>
                    {afterPrice !== undefined ? <span>애프터 {formatValue(afterPrice, foreign)}</span> : null}
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
