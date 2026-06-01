export default function AssetSummaryGrid({ stats, formatNum, afterMarketMetrics }) {
  return (
    <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 mb-6">
      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">순투자원금</p>
        <p className="text-sm sm:text-lg font-black text-slate-800">{formatNum(stats.netInvestment)}</p>
      </div>

      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">총자산(현금포함)</p>
        <p className="text-sm sm:text-lg font-black text-slate-800">{formatNum(stats.totalAsset)}</p>
        {afterMarketMetrics && (
          <p className="mt-1 text-[10px] font-black text-slate-500">정규장: {formatNum(afterMarketMetrics.closeAsset)}</p>
        )}
      </div>

      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">평가금액</p>
        <p className="text-sm sm:text-lg font-black text-slate-800">{formatNum(stats.totalEvaluation)}</p>
        {afterMarketMetrics && (
          <p className="mt-1 text-[10px] font-black text-slate-500">정규장: {formatNum(afterMarketMetrics.closeEvaluation)}</p>
        )}
      </div>

      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">평가손익률</p>
        <p className={`text-sm sm:text-lg font-black ${stats.totalProfitRate >= 0 ? "text-rose-500" : "text-blue-600"}`}>
          {stats.totalProfitRate.toFixed(2)}%
        </p>
        {afterMarketMetrics && (
          <p className="mt-1 text-[10px] font-black text-slate-500">정규장: {afterMarketMetrics.closeProfitRate.toFixed(2)}%</p>
        )}
      </div>

      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">평가손익(현금포함)</p>
        <p className={`text-sm sm:text-lg font-black ${stats.totalProfitAmount >= 0 ? "text-rose-500" : "text-blue-600"}`}>
          {formatNum(stats.totalProfitAmount)}
        </p>
      </div>

      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-1 leading-tight">현금잔고</p>
        <p className="text-sm sm:text-lg font-black text-slate-700">{formatNum(stats.cashBalance)}</p>
      </div>
    </div>
  );
}
