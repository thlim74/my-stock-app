const isForeignTicker = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  market === "AMEX" ||
  (ticker && (ticker.includes(":") || /^[A-Z]/.test(ticker)));

const findFirst = (obj, keys, fallback = undefined) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) return obj[key];
  }
  return fallback;
};

const toNumber = (value) => Number(value) || 0;

const holdingView = (holding) => ({
  name: String(findFirst(holding, ["종목명"], "")),
  qty: toNumber(findFirst(holding, ["보유수량"], 0)),
  avgKrw: toNumber(findFirst(holding, ["평균단가"], 0)),
  avgUsd: toNumber(findFirst(holding, ["평균단가_달러기준"], 0)),
  totalBuy: toNumber(findFirst(holding, ["총매수금액"], 0)),
});

export default function PivotHistoryTab({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleExecuteSearch,
  pivotData,
  stats,
  liveStockPrices,
  formatNum,
  formatFloat,
}) {
  const holdings = (stats?.holdingList || []).map(holdingView);

  return (
    <div>
      <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="text-[13px] font-black text-slate-700">보유종목 일별 추이</div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="text-[11px] font-black text-slate-500">시작일</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
          />
          <span className="text-[11px] font-black text-slate-500">종료일</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
          />
          <button
            onClick={handleExecuteSearch}
            className="text-[12px] font-black bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition-all"
          >
            조회
          </button>
        </div>
      </div>
      <div className="data-table-wrap w-full">
        <table className="data-table w-full text-center whitespace-nowrap">
          <thead className="bg-[#f8fafc] text-slate-700 text-[11px] font-black border-b border-slate-200">
            <tr>
              <th className="bg-slate-100 text-slate-800 font-black sticky left-0 z-10 px-4">종목명</th>
              <th>보유량</th>
              <th>평균단가</th>
              <th>총매수금액</th>
              <th className="text-blue-600 bg-blue-50/30">최신종가</th>
              {pivotData.filteredDates.map((date) => (
                <th key={date} className="px-6 font-bold bg-slate-50 border-l border-slate-200">
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[13px] font-bold text-slate-800">
            <tr className="bg-slate-50 font-black text-slate-900 border-b border-slate-300 h-12">
              <td className="sticky left-0 bg-slate-100 font-black z-10 text-slate-700 text-left px-4">
                일별 수익 합계
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td className="bg-blue-50/20">-</td>
              {pivotData.filteredDates.map((date) => {
                const total = pivotData.dailyColumnTotals[date];
                const isUp = total ? total.profit >= 0 : true;
                return (
                  <td
                    key={date}
                    className={`border-l border-slate-200 font-black ${isUp ? "text-rose-500" : "text-blue-600"}`}
                  >
                    {total && total.profit !== 0
                      ? `${total.profit >= 0 ? "+" : ""}${formatNum(total.profit)} (${total.rate.toFixed(2)}%)`
                      : "0 (0%)"}
                  </td>
                );
              })}
            </tr>
            {pivotData.finalRows.map((row) => {
              const currentHolding = holdings.find((holding) => holding.name === row.name);
              const isForeign = isForeignTicker(row.market, row.ticker);
              const currentQuantity = currentHolding ? currentHolding.qty : 0;
              const currentAverage = currentHolding
                ? isForeign
                  ? currentHolding.avgUsd
                  : currentHolding.avgKrw
                : 0;
              const currentPrice = liveStockPrices[row.ticker] || currentAverage;

              return (
                <tr key={row.ticker || row.name} className="h-12 border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="sticky left-0 bg-white font-black text-left px-4 border-r border-slate-200 z-10">
                    <span className="block text-slate-900 font-black">{row.name}</span>
                    <span className="block text-[10px] text-slate-400 font-medium italic">
                      {row.market}:{row.ticker}
                    </span>
                  </td>
                  <td>{currentQuantity > 0 ? formatNum(currentQuantity) : "0"}</td>
                  <td className="font-mono text-amber-700">
                    {currentQuantity > 0
                      ? isForeign
                        ? `$${formatFloat(currentAverage)}`
                        : formatNum(currentAverage)
                      : "-"}
                  </td>
                  <td className="font-black text-slate-700">
                    {currentHolding ? formatNum(currentHolding.totalBuy) : "-"}
                  </td>
                  <td className="bg-blue-50/10 font-mono font-black text-blue-600">
                    {isForeign ? `$${formatFloat(currentPrice)}` : formatNum(currentPrice)}
                  </td>
                  {pivotData.filteredDates.map((date) => {
                    const snapshot = row.byDate?.[date];
                    if (!snapshot) {
                      return (
                        <td key={date} className="border-l border-slate-200 text-slate-300 font-normal italic">
                          -
                        </td>
                      );
                    }
                    return (
                      <td
                        key={date}
                        className={`border-l border-slate-200 font-medium ${
                          snapshot.profit >= 0 ? "text-rose-500" : "text-blue-500"
                        }`}
                      >
                        <span className="block font-bold">{formatNum(snapshot.profit)}</span>
                        <span className="block text-[11px]">({snapshot.rate.toFixed(1)}%)</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
