export default function AppHeader({ lastUpdate }) {
  return (
    <div className="mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] border border-slate-200 shadow-sm">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
            STOCK-MANAGER ULTIMATE
          </h1>
          <p className="text-sm sm:text-base font-black text-slate-700 mt-1">V39.11</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">
            주식 포트폴리오 통합 관리 대시보드
          </p>
        </div>
        <div className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-2 rounded-xl w-fit">
          Live: {lastUpdate}
        </div>
      </div>
    </div>
  );
}
