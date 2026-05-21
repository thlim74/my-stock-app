export default function AppHeader({ lastUpdate }) {
  return (
    <div className="mb-4 sm:mb-6 bg-white px-5 py-4 sm:px-7 sm:py-5 xl:px-8 xl:py-6 rounded-2xl sm:rounded-[24px] border border-slate-200 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
            STOCK-MANAGER
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[12px] sm:text-[13px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              since 2026
            </span>
            <span className="text-[11px] sm:text-[12px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              Live: {lastUpdate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
