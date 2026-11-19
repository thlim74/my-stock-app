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
  onMove,
  onTickerBlur,
  onNameChange,
  stockMaster,
  liveStockPrices,
  liveStockPreviousCloses,
  afterHoursPrices,
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
          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">종목</th>
                  <th className="px-4 py-3 text-right">현재가</th>
                  <th className="px-4 py-3 text-right">등락률</th>
                  <th className="px-4 py-3 text-right">애프터 시세</th>
                  <th className="px-4 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {watchlist.map((stock, index) => {
                  const foreign = isForeignMarket(stock.market, stock.ticker);
                  const price = liveStockPrices[stock.ticker];
                  const previousClose = liveStockPreviousCloses[stock.ticker];
                  const afterPrice = afterHoursPrices[stock.ticker];
                  const rate = rateText(price, previousClose);
                  const positive = Number(price) >= Number(previousClose);

                  return (
                    <tr key={stock.id} className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-black text-slate-900">{stock.name || stock.ticker}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black text-slate-800">{formatValue(price, foreign)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-black ${positive ? "text-rose-500" : "text-blue-600"}`}>{rate}</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-slate-700">{afterPrice !== undefined ? formatValue(afterPrice, foreign) : "-"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onMove(stock.id, -1)}
                          disabled={index === 0}
                          className="mr-2 text-[11px] font-black text-slate-500 hover:underline disabled:cursor-not-allowed disabled:opacity-30"
                        >위</button>
                        <button
                          onClick={() => onMove(stock.id, 1)}
                          disabled={index === watchlist.length - 1}
                          className="mr-2 text-[11px] font-black text-slate-500 hover:underline disabled:cursor-not-allowed disabled:opacity-30"
                        >아래</button>
                        <button onClick={() => onRemove(stock.id)} className="text-[11px] font-black text-rose-500 hover:underline">삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
