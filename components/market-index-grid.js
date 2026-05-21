export default function MarketIndexGrid({ items }) {
  return (
    <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase leading-tight">
              {item.n}
            </p>
            <p className="text-sm sm:text-base font-black text-slate-800 leading-none">{item.v}</p>
            <span
              className={`text-[10px] sm:text-[11px] font-black px-2 py-1 rounded-lg w-fit ${
                item.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
              }`}
            >
              {item.d}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
