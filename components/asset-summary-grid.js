export default function AssetSummaryGrid({ stats, formatNum }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[10px] font-black text-slate-400 mb-1">순투자원금</p>
        <p className="text-xl font-black text-slate-800">
          ₩ {formatNum(stats.netInvestment)}
        </p>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center relative">
        <p className="text-[10px] font-black text-slate-400 mb-1">
          총자산액 (DoD 트래커)
        </p>
        <p className="text-xl font-black text-slate-800">
          ₩ {formatNum(stats.totalAsset)}
        </p>
        <span
          className={`text-[10px] font-black block mt-0.5 ${stats.assetChangeDoD >= 0 ? "text-rose-500" : "text-blue-500"}`}
        >
          {stats.assetChangeDoD >= 0 ? "▲" : "▼"} ₩
          {formatNum(Math.abs(stats.assetChangeDoD))} (
          {stats.assetChangeRateDoD.toFixed(2)}%)
        </span>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[10px] font-black text-slate-400 mb-1">총가동 수익률</p>
        <p
          className={`text-xl font-black ${stats.totalProfitRate >= 0 ? "text-rose-500" : "text-blue-600"}`}
        >
          {stats.totalProfitRate.toFixed(2)}%
        </p>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[10px] font-black text-slate-400 mb-1">평가금액 합계</p>
        <p className="text-xl font-black text-slate-800">
          ₩ {formatNum(stats.totalEvaluation)}
        </p>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[10px] font-black text-slate-400 mb-1">
          누적 확정실현손익
        </p>
        <p
          className={`text-xl font-black ${stats.totalRealizedProfit >= 0 ? "text-rose-500" : "text-blue-600"}`}
        >
          ₩ {formatNum(stats.totalRealizedProfit)}
        </p>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[10px] font-black text-slate-400 mb-1">
          실시간 예수금 잔고
        </p>
        <p className="text-xl font-black text-slate-700">
          ₩ {formatNum(stats.cashBalance)}
        </p>
      </div>
    </div>
  );
}
