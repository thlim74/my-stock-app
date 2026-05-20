const isForeignMarket = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  market === "AMEX" ||
  (ticker && (ticker.includes(":") || ticker.startsWith("AUTO")));

export default function DailyPricesTab({
  manualPriceForm,
  setManualPriceForm,
  stockMaster,
  handleApplyManualPrice,
  handleCollectDailyPriceHistory,
  activeHoldingQuantities,
  liveStockPrices,
  dailyPriceSnapshots,
  livePriceStatus,
  today,
  formatNum,
  formatFloat,
}) {
  const sortedStocks = [...stockMaster].sort((a, b) => {
    const qtyA = activeHoldingQuantities[a.종목명] || 0;
    const qtyB = activeHoldingQuantities[b.종목명] || 0;

    if ((qtyA > 0) !== (qtyB > 0)) {
      return qtyB > 0 ? 1 : -1;
    }

    if (qtyA !== qtyB) {
      return qtyB - qtyA;
    }

    const dateA = dailyPriceSnapshots[a.티커]?.latestDate || "";
    const dateB = dailyPriceSnapshots[b.티커]?.latestDate || "";

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    return a.종목명.localeCompare(b.종목명, "ko");
  });

  return (
    <div>
      <div className="mb-6 p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex items-end gap-4">
        <div className="text-[13px] font-black text-amber-800">
          현재가 수동 보정
        </div>
        <button
          onClick={handleCollectDailyPriceHistory}
          className="ml-4 bg-slate-800 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-slate-700 transition-all"
        >
          최초 매수일 이후 종가 수집
        </button>
        <div className="space-y-1 ml-auto">
          <select
            value={manualPriceForm.티커}
            onChange={(e) =>
              setManualPriceForm({
                ...manualPriceForm,
                티커: e.target.value,
              })
            }
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold bg-white"
          >
            <option value="">--종목 선택--</option>
            {stockMaster.map((stock) => (
              <option key={stock.id} value={stock.티커}>
                {stock.종목명} ({stock.티커})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <input
            type="number"
            placeholder="현재가 입력"
            value={manualPriceForm.가격}
            onChange={(e) =>
              setManualPriceForm({
                ...manualPriceForm,
                가격: e.target.value,
              })
            }
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
          />
        </div>
        <button
          onClick={handleApplyManualPrice}
          className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-amber-700 transition-all"
        >
          현재가 반영
        </button>
      </div>

      <table className="w-full text-center border-collapse">
        <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
          <tr>
            <th>기준일</th>
            <th>티커</th>
            <th>종목명</th>
            <th>시장구분</th>
            <th>보유수량</th>
            <th>최근 종가</th>
            <th>직전 종가</th>
            <th>장중 현재가</th>
            <th>종가 대비 변동</th>
          </tr>
        </thead>
        <tbody className="text-[12px] font-bold">
          {sortedStocks.map((stock, index) => {
              const isForeign = isForeignMarket(stock.시장, stock.티커);
              const snapshot = dailyPriceSnapshots[stock.티커];
              const priceStatus = livePriceStatus[stock.티커];
              const latestClose = snapshot?.latestPrice ?? null;
              const previousClose = snapshot?.previousPrice ?? null;
              const currentPrice =
                liveStockPrices[stock.티커] !== undefined
                  ? liveStockPrices[stock.티커]
                  : latestClose ?? null;
              const holdingQty = activeHoldingQuantities[stock.종목명] || 0;
              const compareBase = latestClose ?? previousClose;
              const diff =
                currentPrice !== null && compareBase !== null
                  ? currentPrice - compareBase
                  : null;
              const pct =
                diff !== null && compareBase
                  ? ((diff / compareBase) * 100).toFixed(2)
                  : null;

              return (
                <tr
                  key={index}
                  className={`h-11 border-b hover:bg-slate-50 ${holdingQty > 0 ? "bg-blue-50/50" : ""}`}
                >
                  <td>{snapshot?.latestDate || today}</td>
                  <td className="text-blue-600 font-black">{stock.티커}</td>
                  <td className="font-black text-slate-800">{stock.종목명}</td>
                  <td>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">
                      {stock.시장}
                    </span>
                  </td>
                  <td
                    className={
                      holdingQty > 0
                        ? "font-black text-blue-600 bg-blue-100/30"
                        : "text-slate-400 font-normal"
                    }
                  >
                    {formatNum(holdingQty)}
                  </td>
                  <td className="font-mono text-slate-900">
                    {latestClose === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(latestClose)}`
                        : `₩${formatNum(latestClose)}`}
                  </td>
                  <td className="font-mono text-slate-500">
                    {previousClose === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(previousClose)}`
                        : `₩${formatNum(previousClose)}`}
                  </td>
                  <td className="font-mono font-black text-slate-900">
                    {currentPrice === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(currentPrice)}`
                        : `₩${formatNum(currentPrice)}`}
                    {priceStatus && (
                      <div
                        className={`mt-1 text-[10px] font-bold ${priceStatus.ok ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {priceStatus.message}
                      </div>
                    )}
                  </td>
                  <td>
                    {pct === null ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`text-[11px] font-black ${diff >= 0 ? "text-rose-500" : "text-blue-500"}`}
                      >
                        {diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(Number(pct)).toFixed(2)}%`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
