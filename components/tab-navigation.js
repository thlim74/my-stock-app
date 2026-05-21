const TABS = [
  "보유현황",
  "일별수익률",
  "보유종목일별",
  "월별수익률",
  "입출금",
  "거래관리",
  "종목마스터",
  "일별종가",
];

export default function TabNavigation({
  activeTab,
  onSelectTab,
}) {
  return (
    <div className="flex overflow-x-auto whitespace-nowrap bg-slate-50 p-2 gap-1 border-b border-slate-200">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelectTab(tab)}
          className={`shrink-0 px-4 sm:px-6 py-3 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
