export default function AppHeader({
  handleDownloadTemplate,
  csvUploadRef,
  handleDownloadBackup,
  fileInputRef,
  handleUploadBackup,
  handleUploadCSV,
  lastUpdate,
}) {
  return (
    <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          📊 STOCK-MANAGER ULTIMATE V39.11
        </h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1">
          보유종목일별 필터 조회 기능 버그 전면 해결 완전체
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDownloadTemplate}
          className="text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all"
        >
          📥 통합 일괄양식(.CSV) 받기
        </button>
        <button
          onClick={() => csvUploadRef.current.click()}
          className="text-[11px] font-black bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
        >
          🚀 통합 엑셀(.CSV) 대량 업로드
        </button>
        <button
          onClick={handleDownloadBackup}
          className="text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 transition-all"
        >
          💾 전체 데이터 백업 (JSON)
        </button>
        <button
          onClick={() => fileInputRef.current.click()}
          className="text-[11px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-3 py-2 rounded-xl hover:bg-amber-100 transition-all"
        >
          📂 전체 백업 복구 (JSON)
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadBackup}
          accept=".json"
          className="hidden"
        />
        <input
          type="file"
          ref={csvUploadRef}
          onChange={handleUploadCSV}
          accept=".csv"
          className="hidden"
        />
        <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-2 rounded-xl ml-2">
          Live: {lastUpdate}
        </span>
      </div>
    </div>
  );
}
