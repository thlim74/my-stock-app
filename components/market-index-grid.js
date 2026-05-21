export default function MarketIndexGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
        >
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">
              {item.n}
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800">{item.v}</p>
          </div>
          <span
            className={`text-[11px] font-black px-2 py-1 rounded-lg ${item.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
          >
            {item.d}
          </span>
        </div>
      ))}
    </div>
  );
}
