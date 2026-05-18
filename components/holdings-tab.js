const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-purple-500",
];

const isForeignHolding = (holding) =>
  holding.시장 === "NASDAQ" ||
  holding.시장 === "NYSE" ||
  (holding.티커 &&
    (holding.티커.includes(":") || holding.티커.startsWith("AUTO")));

export default function HoldingsTab({ stats, formatNum, formatFloat }) {
  return (
    <div>
      <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 className="text-[12px] font-black text-slate-600 mb-3 uppercase">
          📂 포트폴리오 섹터 분산 비중
        </h3>
        <div className="w-full flex h-6 rounded-xl overflow-hidden border border-slate-300">
          {stats.sectorWeights.map((sectorWeight, index) => (
            <div
              key={index}
              style={{ width: `${sectorWeight.percentage}%` }}
              className={`${COLORS[index % COLORS.length]} h-full relative group transition-all hover:opacity-90`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white truncate px-1">
                {sectorWeight.percentage > 7
                  ? `${sectorWeight.name}(${sectorWeight.percentage}%)`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <table className="w-full text-center border-collapse">
        <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
          <tr>
            <th>종목명</th>
            <th>티커</th>
            <th>시장구분</th>
            <th>보유량</th>
            <th>평균단가</th>
            <th>장중 현재가 (Live)</th>
            <th>평가금액</th>
            <th>손익(원화)</th>
            <th>수익률</th>
          </tr>
        </thead>
        <tbody className="text-[13px] font-bold">
          {stats.holdingList.map((holding, index) => {
            const isForeign = isForeignHolding(holding);
            return (
              <tr key={index} className="h-12 border-b hover:bg-slate-50">
                <td className="font-black text-blue-600">{holding.종목명}</td>
                <td className="italic text-slate-400">{holding.티커}</td>
                <td>
                  <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {holding.시장}
                  </span>
                </td>
                <td>{formatNum(holding.보유량)}</td>
                <td className="font-mono text-amber-700">
                  {isForeign
                    ? `$ ${formatFloat(holding.평균단가외국)}`
                    : `₩ ${formatNum(holding.평균단가)}`}
                </td>
                <td className="font-mono text-blue-600">
                  {isForeign
                    ? `$ ${formatFloat(holding.현재가)}`
                    : `₩ ${formatNum(holding.현재가)}`}
                </td>
                <td className="font-black text-slate-800">
                  ₩ {formatNum(holding.평가금액)}
                </td>
                <td
                  className={
                    holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                  }
                >
                  {holding.손익 >= 0 ? "+" : ""}
                  {formatNum(holding.손익)}
                </td>
                <td
                  className={
                    holding.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                  }
                >
                  {holding.수익률}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
