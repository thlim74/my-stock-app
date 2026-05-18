export default function StockMasterTab({
  handleDownloadMasterCsv,
  tabMasterCsvRef,
  handleUploadMasterCsv,
  masterEditingId,
  resetForms,
  newStock,
  setNewStock,
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
      <div className="mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-[12px]">
        <div>
          <span className="font-black text-purple-800">
            💡 종목 마스터 메인 풀 관리 커맨더
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadMasterCsv}
            className="bg-white text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg font-black hover:bg-purple-100/50 transition-all"
          >
            📥 마스터 레코드 내보내기
          </button>
          <button
            onClick={() => tabMasterCsvRef.current.click()}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-purple-700 transition-all"
          >
            📤 마스터 CSV 업로드
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
        className={`mb-8 p-6 rounded-2xl border transition-all ${masterEditingId ? "bg-amber-50/50 border-amber-300 shadow-md" : "bg-slate-50 border-slate-200"} grid grid-cols-5 gap-4 items-end`}
      >
        <div className="col-span-5 font-black text-[13px] text-slate-700 flex justify-between">
          <span>
            {masterEditingId
              ? "⚠️ [마스터 메타 데이터 수정 오버라이드]"
              : "➕ 신규 유니버스 자산 마스터 사전 기입"}
          </span>
          {masterEditingId && (
            <button
              onClick={resetForms}
              className="text-slate-400 underline text-[11px]"
            >
              취소
            </button>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">종목명</label>
          <input
            type="text"
            value={newStock.종목명}
            onChange={(e) => setNewStock({ ...newStock, 종목명: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">티커코드</label>
          <input
            type="text"
            value={newStock.티커}
            onChange={(e) => setNewStock({ ...newStock, 티커: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
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
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">섹터군분류</label>
          <select
            value={newStock.섹터}
            onChange={(e) => setNewStock({ ...newStock, 섹터: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          >
            <option>일반제조/서비스</option>
            <option>바이오/헬스케어</option>
            <option>전기차/자동차</option>
            <option>2차전지/친환경에너지</option>
            <option>금융/지주사</option>
          </select>
        </div>
        <button
          onClick={saveMaster}
          className="bg-purple-700 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md hover:bg-purple-800 transition-all"
        >
          {masterEditingId ? "수정사항 저장" : "마스터 등록"}
        </button>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          onClick={deleteSelected}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
        >
          선택 종목 일괄 삭제
        </button>
      </div>

      <table className="w-full text-center border-collapse">
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
                {stock.섹터 || "일반제조/서비스"}
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
  );
}
