const TABS = [
  "보유현황",
  "일별수익률",
  "보유종목일별",
  "월별수익률",
  "입출금",
  "거래관리",
  "종목마스터",
  "일별종가",
  "관리",
];

export default function TabNavigation({ activeTab, onSelectTab }) {
  return (
    <div className="bg-slate-50 p-2 sm:p-3 border-b border-slate-200">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-[12px] sm:text-[13px] font-black transition-all ${
              activeTab === tab
                ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
