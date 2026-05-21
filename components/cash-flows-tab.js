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
  cashEditingId,
  triggerEditCash,
  cashTotalInput,
  setCashTotalInput,
  applyCashTotalAdjustment,
  currentCashTotal,
}) {
  return (
    <div>
      <div className="mb-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-[12px]">
        <div>
          <span className="font-black text-blue-800">입출금 관리</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCashCsv}
            className="bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-black hover:bg-blue-100/50 transition-all"
          >
            CSV 다운로드
          </button>
          <button
            onClick={() => tabCashCsvRef.current.click()}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-blue-700 transition-all"
          >
            CSV 업로드
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

      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
          <div className="space-y-1">
            <div className="text-[12px] font-black text-blue-700">현금총액</div>
            <input
              type="text"
              value={cashTotalInput}
              onChange={(e) => setCashTotalInput(e.target.value)}
              className="w-full lg:w-56 border rounded-xl p-2.5 text-[12px] font-bold"
              placeholder="현금총액 입력"
            />
          </div>
          <button
            onClick={applyCashTotalAdjustment}
            className="bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[12px] font-black hover:bg-blue-800 transition-all"
          >
            수정
          </button>
          <div className="text-[11px] font-bold text-slate-500 lg:ml-auto">
            현재 계산 현금: <span className="text-blue-700">{formatNum(currentCashTotal)}</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] font-bold text-slate-400">
          현금총액 수정은 현금 보정용이며 입출금 내역과 순투자원금에는 반영되지 않습니다.
        </div>
      </div>

      <div
        className={`mb-6 p-4 sm:p-6 rounded-2xl border ${
          cashEditingId
            ? "bg-amber-50/50 border-amber-300"
            : "bg-slate-50 border-slate-200"
        } grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 items-end`}
      >
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
          <label className="text-[11px] font-black text-slate-500">금액 (KRW)</label>
          <input
            type="text"
            value={newCash.금액}
            onChange={(e) => setNewCash({ ...newCash, 금액: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
            placeholder="숫자만 입력"
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
          {cashEditingId ? "입출금 수정" : "입출금 저장"}
        </button>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          onClick={deleteSelected}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
        >
          선택 항목 삭제
        </button>
      </div>

      <div className="grid gap-3 md:hidden">
        {cashFlows.map((cash) => (
          <div key={cash.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-black text-slate-700">{cash.날짜}</div>
              <div
                className={`text-[12px] font-black ${
                  cash.구분 === "입금" ? "text-rose-500" : "text-blue-500"
                }`}
              >
                {cash.구분}
              </div>
            </div>
            <div className="mt-2 text-[14px] font-black text-slate-900">
              {formatNum(cash.금액)}
            </div>
            <div className="mt-1 text-[12px] text-slate-500">{cash.메모 || "-"}</div>
            <div className="mt-3 flex items-center justify-between">
              <label className="text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedIds.includes(cash.id)}
                  onChange={() => toggleSelect(cash.id)}
                />
                선택
              </label>
              <div className="space-x-3">
                <button
                  onClick={() => triggerEditCash(cash)}
                  className="text-amber-600 underline text-[12px] font-black"
                >
                  수정
                </button>
                <button
                  onClick={() => deleteItem(cash.id)}
                  className="text-rose-500 underline text-[12px]"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block data-table-wrap">
        <table className="data-table min-w-[760px] text-center">
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
                <td className={cash.구분 === "입금" ? "text-rose-500" : "text-blue-500"}>
                  {cash.구분}
                </td>
                <td className="font-black">{formatNum(cash.금액)}</td>
                <td className="text-slate-600 text-left px-4">{cash.메모 || "-"}</td>
                <td className="space-x-2">
                  <button
                    onClick={() => triggerEditCash(cash)}
                    className="text-amber-600 underline text-[12px] font-black"
                  >
                    수정
                  </button>
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
    </div>
  );
}
