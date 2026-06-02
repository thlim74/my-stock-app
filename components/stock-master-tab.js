export default function StockMasterTab({
  handleDownloadMasterCsv,
  tabMasterCsvRef,
  handleUploadMasterCsv,
  masterEditingId,
  resetForms,
  newStock,
  setNewStock,
  handleStockNameChange,
  handleStockTickerBlur,
  saveMaster,
  deleteSelected,
  stockMaster,
  selectedIds,
  handleSelectAllToggle,
  toggleSelect,
  triggerEditMaster,
  deleteItem,
}) {
  return (
    <div>
      <div className="mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px]">
        <div>
          <span className="font-black text-purple-800">종목마스터 관리</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={handleDownloadMasterCsv}
            className="bg-white text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg font-black hover:bg-purple-100/50 transition-all"
          >
            CSV 다운로드
          </button>
          <button
            onClick={() => tabMasterCsvRef.current.click()}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-purple-700 transition-all"
          >
            CSV 업로드
          </button>
          <input
            type="file"
            ref={tabMasterCsvRef}
            onChange={handleUploadMasterCsv}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <div
        className={`mb-8 p-4 sm:p-6 rounded-2xl border transition-all ${masterEditingId ? "bg-amber-50/50 border-amber-300 shadow-md" : "bg-slate-50 border-slate-200"} grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 items-end`}
      >
        <div className="col-span-1 sm:col-span-2 xl:col-span-5 font-black text-[13px] text-slate-700 flex justify-between">
          <span>
            {masterEditingId ? "마스터 수정 모드" : "신규 종목 등록"}
          </span>
          {masterEditingId && (
            <button onClick={resetForms} className="text-slate-400 underline text-[11px]">
              취소
            </button>
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-[11px] font-black text-slate-500">종목명</label>
          <input
            type="text"
            value={newStock.종목명}
            onChange={(e) => handleStockNameChange(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
            placeholder="종목명 입력 시 자동 매핑"
          />
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-[11px] font-black text-slate-500">티커코드</label>
          <input
            type="text"
            value={newStock.티커}
            onChange={(e) => setNewStock({ ...newStock, 티커: e.target.value })}
            onBlur={handleStockTickerBlur}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold uppercase"
            placeholder="예: 005930, GOOGL, AMEX:SLV"
          />
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-[11px] font-black text-slate-500">시장분류</label>
          <select
            value={newStock.시장}
            onChange={(e) => setNewStock({ ...newStock, 시장: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          >
            <option>KOSPI</option>
            <option>KOSDAQ</option>
            <option>NASDAQ</option>
            <option>NYSE</option>
            <option>AMEX</option>
          </select>
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-[11px] font-black text-slate-500">섹터분류</label>
          <input
            type="text"
            value={newStock.섹터}
            onChange={(e) => setNewStock({ ...newStock, 섹터: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>

        <button
          onClick={saveMaster}
          className="w-full sm:col-span-2 xl:col-span-1 bg-purple-700 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md hover:bg-purple-800 transition-all"
        >
          {masterEditingId ? "수정 저장" : "종목 등록"}
        </button>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          onClick={deleteSelected}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
        >
          선택 종목 삭제
        </button>
      </div>

      <div className="data-table-wrap">
      <table className="data-table min-w-[820px] text-center">
        <thead className="bg-slate-800 text-white text-[11px] font-black">
          <tr>
            <th className="w-12">
              <input
                type="checkbox"
                checked={
                  stockMaster.length > 0 &&
                  stockMaster.every((stock) => selectedIds.includes(stock.id))
                }
                onChange={handleSelectAllToggle}
              />
            </th>
            <th>티커코드</th>
            <th>종목명</th>
            <th>시장분류</th>
            <th>섹터분류</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {stockMaster.map((stock) => (
            <tr
              key={stock.id}
              className={`h-12 border-b hover:bg-slate-50 ${masterEditingId === stock.id ? "bg-amber-50" : ""}`}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(stock.id)}
                  onChange={() => toggleSelect(stock.id)}
                />
              </td>
              <td className="text-blue-600 font-black italic">{stock.티커}</td>
              <td className="font-black text-slate-800">{stock.종목명}</td>
              <td>
                <span className="px-2 py-0.5 text-[11px] font-black rounded-md bg-purple-50 text-purple-600">
                  {stock.시장}
                </span>
              </td>
              <td className="text-emerald-600 text-[12px]">
                {stock.섹터 || "-"}
              </td>
              <td className="space-x-2">
                <button
                  onClick={() => triggerEditMaster(stock)}
                  className="text-amber-600 underline font-black text-[12px]"
                >
                  수정
                </button>
                <button
                  onClick={() => deleteItem(stock.id)}
                  className="text-rose-500 underline text-[12px]"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
