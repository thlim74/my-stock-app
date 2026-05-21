import { inferMarketFromTicker, isForeignMarket } from "@/lib/market-utils";

export default function TransactionsTab({
  handleDownloadTxCsv,
  tabTxCsvRef,
  handleUploadTxCsv,
  editingId,
  resetForms,
  newTx,
  setNewTx,
  stockMaster,
  saveTx,
  deleteSelected,
  transactions,
  selectedIds,
  handleSelectAllToggle,
  toggleSelect,
  formatNum,
  formatFloat,
  exchangeRate,
  triggerEditTx,
  deleteItem,
}) {
  return (
    <div>
      <div className="mb-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-[12px]">
        <div>
          <span className="font-black text-emerald-800">거래관리</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTxCsv}
            className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-100/50 transition-all"
          >
            CSV 다운로드
          </button>
          <button
            onClick={() => tabTxCsvRef.current.click()}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-emerald-700 transition-all"
          >
            CSV 업로드
          </button>
          <input
            type="file"
            ref={tabTxCsvRef}
            onChange={handleUploadTxCsv}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <div
        className={`mb-8 p-4 sm:p-6 rounded-2xl border transition-all ${
          editingId
            ? "bg-amber-50/50 border-amber-300 shadow-md"
            : "bg-slate-50 border-slate-200"
        } grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-end`}
      >
        <div className="col-span-4 font-black text-[14px] text-slate-700 flex justify-between">
          <span>{editingId ? "매매 내역 수정" : "신규 매매 입력"}</span>
          {editingId && (
            <button onClick={resetForms} className="text-slate-400 underline text-[11px]">
              취소
            </button>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">날짜</label>
          <input
            type="date"
            value={newTx.날짜}
            onChange={(e) => setNewTx({ ...newTx, 날짜: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">구분</label>
          <select
            value={newTx.구분}
            onChange={(e) => setNewTx({ ...newTx, 구분: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          >
            <option>매수</option>
            <option>매도</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">종목 선택</label>
          <select
            value={newTx.종목명}
            onChange={(e) => {
              const found = stockMaster.find((stock) => stock.종목명 === e.target.value);
              setNewTx({
                ...newTx,
                종목명: e.target.value,
                티커: found ? found.티커 : "",
              });
            }}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold bg-white"
          >
            <option value="">--선택--</option>
            {stockMaster.map((stock) => (
              <option key={stock.id} value={stock.종목명}>
                {stock.종목명} ({stock.티커})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">수량</label>
          <input
            type="text"
            value={newTx.수량}
            onChange={(e) => setNewTx({ ...newTx, 수량: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">단가</label>
          <input
            type="text"
            value={newTx.단가}
            onChange={(e) => setNewTx({ ...newTx, 단가: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">수수료</label>
          <input
            type="text"
            value={newTx.수수료}
            onChange={(e) => setNewTx({ ...newTx, 수수료: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500">세금</label>
          <input
            type="text"
            value={newTx.세금}
            onChange={(e) => setNewTx({ ...newTx, 세금: e.target.value })}
            className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
          />
        </div>
        <button
          onClick={saveTx}
          className={`w-full py-3.5 rounded-xl text-[12px] font-black text-white ${
            editingId ? "bg-amber-600" : "bg-slate-900"
          }`}
        >
          거래 저장
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
        {transactions.map((tx) => {
          const currentMasterMatch = stockMaster.find(
            (stock) => stock.티커 === tx.티커 || stock.종목명 === tx.종목명,
          );
          const currentMarket = currentMasterMatch
            ? currentMasterMatch.시장
            : inferMarketFromTicker(tx.티커);
          const isForeign = isForeignMarket(currentMarket, tx.티커);
          const quantity = Number(tx.수량) || 0;
          const price = Number(tx.단가) || 0;
          const fee = Number(tx.수수료) || 0;
          const tax = Number(tx.세금) || 0;
          const activeTotalKrw =
            tx.구분 === "매수"
              ? isForeign
                ? (quantity * price + fee + tax) * exchangeRate
                : quantity * price + fee + tax
              : isForeign
                ? (quantity * price - fee - tax) * exchangeRate
                : quantity * price - fee - tax;

          return (
            <div key={tx.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-black text-slate-700">{tx.날짜}</div>
                <div
                  className={
                    tx.구분 === "매수"
                      ? "text-rose-500 text-[12px] font-black"
                      : "text-blue-500 text-[12px] font-black"
                  }
                >
                  {tx.구분}
                </div>
              </div>
              <div className="mt-1 text-[14px] font-black text-slate-900">{tx.종목명}</div>
              <div className="text-[11px] text-slate-500">
                {tx.티커} ({currentMarket})
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <div>수량: <b>{formatNum(tx.수량)}</b></div>
                <div>단가: <b>{isForeign ? `$ ${formatFloat(tx.단가)}` : `${formatNum(tx.단가)}`}</b></div>
                <div>수수료: <b>{isForeign ? `$ ${formatFloat(tx.수수료)}` : `${formatNum(tx.수수료)}`}</b></div>
                <div>세금: <b>{isForeign ? `$ ${formatFloat(tx.세금)}` : `${formatNum(tx.세금)}`}</b></div>
              </div>
              <div className="mt-2 text-[12px] font-black text-slate-700">
                원화 합계: {formatNum(activeTotalKrw)}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="text-[11px] text-slate-500">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedIds.includes(tx.id)}
                    onChange={() => toggleSelect(tx.id)}
                  />
                  선택
                </label>
                <div className="space-x-3">
                  <button
                    onClick={() => triggerEditTx(tx)}
                    className="text-amber-600 underline font-black text-[12px]"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteItem(tx.id)}
                    className="text-rose-500 underline text-[12px]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block data-table-wrap">
        <table className="data-table min-w-[1100px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black">
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={
                    transactions.length > 0 &&
                    transactions.every((tx) => selectedIds.includes(tx.id))
                  }
                  onChange={handleSelectAllToggle}
                />
              </th>
              <th>날짜</th>
              <th>구분</th>
              <th>종목명</th>
              <th>티커</th>
              <th>수량</th>
              <th>거래단가</th>
              <th>수수료</th>
              <th>세금</th>
              <th>원화 계산총액</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold">
            {transactions.map((tx) => {
              const currentMasterMatch = stockMaster.find(
                (stock) => stock.티커 === tx.티커 || stock.종목명 === tx.종목명,
              );
              const currentMarket = currentMasterMatch
                ? currentMasterMatch.시장
                : inferMarketFromTicker(tx.티커);
              const isForeign = isForeignMarket(currentMarket, tx.티커);
              const quantity = Number(tx.수량) || 0;
              const price = Number(tx.단가) || 0;
              const fee = Number(tx.수수료) || 0;
              const tax = Number(tx.세금) || 0;
              const activeTotalKrw =
                tx.구분 === "매수"
                  ? isForeign
                    ? (quantity * price + fee + tax) * exchangeRate
                    : quantity * price + fee + tax
                  : isForeign
                    ? (quantity * price - fee - tax) * exchangeRate
                    : quantity * price - fee - tax;

              return (
                <tr
                  key={tx.id}
                  className={`h-11 border-b hover:bg-slate-50 ${
                    editingId === tx.id ? "bg-amber-50" : ""
                  }`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                    />
                  </td>
                  <td>{tx.날짜}</td>
                  <td className={tx.구분 === "매수" ? "text-rose-500" : "text-blue-500"}>
                    {tx.구분}
                  </td>
                  <td className="font-black text-slate-800">{tx.종목명}</td>
                  <td className="text-slate-400 italic">
                    {tx.티커}{" "}
                    <span className="text-[9px] font-black text-purple-600">
                      ({currentMarket})
                    </span>
                  </td>
                  <td>{formatNum(tx.수량)}</td>
                  <td className="font-mono text-amber-700">
                    {isForeign ? `$ ${formatFloat(tx.단가)}` : formatNum(tx.단가)}
                  </td>
                  <td className="text-slate-500">
                    {isForeign ? `$ ${formatFloat(tx.수수료)}` : formatNum(tx.수수료)}
                  </td>
                  <td className="text-slate-500">
                    {isForeign ? `$ ${formatFloat(tx.세금)}` : formatNum(tx.세금)}
                  </td>
                  <td className="font-black text-slate-700">{formatNum(activeTotalKrw)}</td>
                  <td className="space-x-2">
                    <button
                      onClick={() => triggerEditTx(tx)}
                      className="text-amber-600 underline font-black"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteItem(tx.id)}
                      className="text-rose-500 underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
