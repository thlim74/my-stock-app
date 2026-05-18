export default function CashFlowsTab({
  handleDownloadCashCsv,
  tabCashCsvRef,
  handleUploadCashCsv,
  newCash,
  setNewCash,
  saveCash,
  deleteSelected,
  cashFlows,
  selectedIds,
  handleSelectAllToggle,
  toggleSelect,
  deleteItem,
  formatNum,
}) {
  return (
    <div>
      <div className="mb-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-[12px]">
        <div>
          <span className="font-black text-blue-800">
            💡 자본 원금 관리 프레임워크
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCashCsv}
            className="bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-black hover:bg-blue-100/50 transition-all"
          >
            📥 입출금 내역 내보내기
          </button>
          <button
            onClick={() => tabCashCsvRef.current.click()}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-blue-700 transition-all"
          >
            📤 입출금 CSV 로드
          </button>
          <input
            type="file"
            ref={tabCashCsvRef}
            onChange={handleUploadCashCsv}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <div className="mb-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-5 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">날짜</label>
          <input
            type="date"
            value={newCash.날짜}
            onChange={(e) => setNewCash({ ...newCash, 날짜: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">구분</label>
          <select
            value={newCash.구분}
            onChange={(e) => setNewCash({ ...newCash, 구분: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          >
            <option>입금</option>
            <option>출금</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">
            현금 원금액(KRW)
          </label>
          <input
            type="text"
            value={newCash.금액}
            onChange={(e) => setNewCash({ ...newCash, 금액: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
            placeholder="컴마 없이 입력"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">메모</label>
          <input
            type="text"
            value={newCash.메모}
            onChange={(e) => setNewCash({ ...newCash, 메모: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <button
          onClick={saveCash}
          className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md hover:bg-slate-800 transition-all"
        >
          투자원금 거래 반영
        </button>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          onClick={deleteSelected}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
        >
          선택 일괄 삭제
        </button>
      </div>

      <table className="w-full text-center border-collapse">
        <thead className="bg-slate-800 text-white text-[11px] font-black">
          <tr>
            <th className="w-12">
              <input
                type="checkbox"
                checked={
                  cashFlows.length > 0 &&
                  cashFlows.every((cash) => selectedIds.includes(cash.id))
                }
                onChange={handleSelectAllToggle}
              />
            </th>
            <th>날짜</th>
            <th>구분</th>
            <th>금액</th>
            <th>메모</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {cashFlows.map((cash) => (
            <tr key={cash.id} className="h-11 border-b hover:bg-slate-50">
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(cash.id)}
                  onChange={() => toggleSelect(cash.id)}
                />
              </td>
              <td>{cash.날짜}</td>
              <td
                className={cash.구분 === "입금" ? "text-rose-500" : "text-blue-500"}
              >
                {cash.구분}
              </td>
              <td className="font-black">₩{formatNum(cash.금액)}</td>
              <td className="text-slate-600 text-left px-4">{cash.메모 || "-"}</td>
              <td>
                <button
                  onClick={() => deleteItem(cash.id)}
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
