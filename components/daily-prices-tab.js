const isForeignMarket = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  (ticker && (ticker.includes(":") || ticker.startsWith("AUTO")));

export default function DailyPricesTab({
  manualPriceForm,
  setManualPriceForm,
  stockMaster,
  handleApplyManualPrice,
  activeHoldingQuantities,
  liveStockPrices,
  defaultStockPrices,
  today,
  formatNum,
  formatFloat,
}) {
  return (
    <div>
      <div className="mb-6 p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex items-end gap-4">
        <div className="text-[13px] font-black text-amber-800">
          🛠️ 가상 주가 강제 수동 제어
        </div>
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
            placeholder="단가 지정(해외=달러)"
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
          시세 오버라이드 고정
        </button>
      </div>

      <table className="w-full text-center border-collapse">
        <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
          <tr>
            <th>기준일자</th>
            <th>티커</th>
            <th>종목명</th>
            <th>시장구분</th>
            <th>현재 보유수량</th>
            <th>장중 현재가 (Live)</th>
            <th>기준대비 변동추이</th>
          </tr>
        </thead>
        <tbody className="text-[12px] font-bold">
          {[...stockMaster]
            .sort((a, b) => {
              const qtyA = activeHoldingQuantities[a.종목명] || 0;
              const qtyB = activeHoldingQuantities[b.종목명] || 0;
              return qtyB - qtyA;
            })
            .map((stock, index) => {
              const isForeign = isForeignMarket(stock.시장, stock.티커);
              const currentPrice =
                liveStockPrices[stock.티커] !== undefined
                  ? liveStockPrices[stock.티커]
                  : isForeign
                    ? 10.0
                    : 10000;
              const originPrice =
                defaultStockPrices[stock.티커] || (isForeign ? 10.0 : 10000);
              const diff = currentPrice - originPrice;
              const pct = ((diff / originPrice) * 100).toFixed(2);
              const holdingQty = activeHoldingQuantities[stock.종목명] || 0;

              return (
                <tr
                  key={index}
                  className={`h-11 border-b hover:bg-slate-50 ${holdingQty > 0 ? "bg-blue-50/50" : ""}`}
                >
                  <td>{today}</td>
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
                  <td className="font-mono font-black text-slate-900">
                    {isForeign
                      ? `$ ${formatFloat(currentPrice)}`
                      : `₩ ${formatNum(currentPrice)}`}
                  </td>
                  <td>
                    <span
                      className={`text-[11px] font-black ${diff >= 0 ? "text-rose-500" : "text-blue-500"}`}
                    >
                      {diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
