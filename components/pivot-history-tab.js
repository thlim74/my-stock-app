const isForeignTicker = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  (ticker && (ticker.includes(":") || ticker.startsWith("AUTO")));

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
  return (
    <div>
      <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div>
          <span className="text-[13px] font-black text-slate-700 block">
            📊 보유 종목별 가로 전개 피벗 매트릭스
          </span>
          <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
            시작일과 종료일을 지정한 후 조회 버튼을 누르세요.
          </span>
        </div>
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
      <div className="w-full overflow-x-auto border rounded-2xl border-slate-200">
        <table className="w-full text-center border-collapse whitespace-nowrap">
          <thead className="bg-[#f8fafc] text-slate-700 text-[11px] font-black border-b border-slate-200">
            <tr>
              <th className="bg-slate-100 text-slate-800 font-black sticky left-0 z-10 px-4">
                종목명
              </th>
              <th>현재보유량</th>
              <th>평단가</th>
              <th className="text-blue-600 bg-blue-50/30">실시간주가</th>
              {pivotData.filteredDates.map((date) => (
                <th
                  key={date}
                  className="px-6 font-bold bg-slate-50 border-l border-slate-200"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold text-slate-800">
            <tr className="bg-slate-50 font-black text-slate-900 border-b border-slate-300 h-12">
              <td className="sticky left-0 bg-slate-100 font-black z-10 text-slate-700 text-left px-4">
                일별 수익 합계
              </td>
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
            {pivotData.finalRows.map((row, index) => {
              const currentHolding = stats.holdingList.find(
                (holding) => holding.종목명 === row.종목명,
              );
              const isForeign = isForeignTicker(row.시장, row.티커);
              const currentQuantity = currentHolding ? currentHolding.보유량 : 0;
              const currentAverage = currentHolding
                ? isForeign
                  ? currentHolding.평균단가외국
                  : currentHolding.평균단가
                : 0;
              const currentPrice = liveStockPrices[row.티커] || currentAverage;

              return (
                <tr
                  key={index}
                  className="h-12 border-b border-slate-200 hover:bg-slate-50/50"
                >
                  <td className="sticky left-0 bg-white font-black text-left px-4 border-r border-slate-200 z-10">
                    <span className="block text-slate-900 font-black">
                      {row.종목명}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-medium italic">
                      {row.시장}:{row.티커}
                    </span>
                  </td>
                  <td>{currentQuantity > 0 ? formatNum(currentQuantity) : "0"}</td>
                  <td className="font-mono text-amber-700">
                    {currentQuantity > 0
                      ? isForeign
                        ? `$${formatFloat(currentAverage)}`
                        : `₩${formatNum(currentAverage)}`
                      : "-"}
                  </td>
                  <td className="bg-blue-50/10 font-mono font-black text-blue-600">
                    {isForeign
                      ? `$${formatFloat(currentPrice)}`
                      : `₩${formatNum(currentPrice)}`}
                  </td>
                  {pivotData.filteredDates.map((date) => {
                    const snapshot = row.역사적내역[date];
                    if (!snapshot) {
                      return (
                        <td
                          key={date}
                          className="border-l border-slate-200 text-slate-300 font-normal italic"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={date}
                        className={`border-l border-slate-200 font-medium ${snapshot.profit >= 0 ? "text-rose-500" : "text-blue-500"}`}
                      >
                        <span className="block font-bold">
                          ₩{formatNum(snapshot.profit)}
                        </span>
                        <span className="block text-[10px]">
                          ({snapshot.rate.toFixed(1)}%)
                        </span>
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
