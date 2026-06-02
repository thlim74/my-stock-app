export default function AppHeader({
  lastUpdate,
  authUser,
  onLogout,
  portfolios = [],
  activePortfolioId = "default",
  onPortfolioChange,
  onCreatePortfolio,
}) {
  return (
    <div className="mb-4 sm:mb-6 bg-white px-5 py-4 sm:px-7 sm:py-5 xl:px-8 xl:py-6 rounded-2xl sm:rounded-[24px] border border-slate-200 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

        {authUser && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activePortfolioId}
              onChange={(event) => onPortfolioChange?.(event.target.value)}
              className="min-w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-black text-slate-800"
            >
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
            <button
              onClick={onCreatePortfolio}
              className="text-[12px] font-black bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-100"
            >
              포트폴리오 추가
            </button>
            <button
              onClick={onLogout}
              className="text-[12px] font-black bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-200"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
