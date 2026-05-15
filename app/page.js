"use client";
import { useState } from "react";

export default function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState("일별종가");

  // --- [데이터] 종목 마스터 (보유종목 리스트) ---
  const [masterList] = useState([
    { ticker: "KRX:005930", name: "삼성전자" },
    { ticker: "KRX:000660", name: "SK하이닉스" },
    { ticker: "KRX:091230", name: "tiger 반도체" },
    { ticker: "KRX:226490", name: "kodex 코스피" },
  ]);

  // --- [데이터] 일별 종가 내역 (이미지 1718c9 등의 계산 근거) ---
  const [dailyPrices, setDailyPrices] = useState([
    {
      date: "2026-05-15",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 274000,
    },
    {
      date: "2026-05-15",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1842000,
    },
    {
      date: "2026-05-15",
      ticker: "KRX:091230",
      name: "tiger 반도체",
      price: 154165,
    },
    {
      date: "2026-05-15",
      ticker: "KRX:226490",
      name: "kodex 코스피",
      price: 77575,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 296000,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1970000,
    },
  ]);

  // --- [입력 폼] 종가 입력용 ---
  const [priceForm, setPriceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    ticker: "KRX:005930",
    price: "",
  });

  // --- [기능] 종가 저장 ---
  const handleAddPrice = () => {
    if (!priceForm.price) return alert("가격을 입력해주세요.");

    const selectedStock = masterList.find((s) => s.ticker === priceForm.ticker);
    const newEntry = {
      ...priceForm,
      name: selectedStock.name,
      price: Number(priceForm.price),
    };

    // 중복 체크 (날짜+티커)
    const isDuplicate = dailyPrices.some(
      (p) => p.date === newEntry.date && p.ticker === newEntry.ticker,
    );
    if (isDuplicate)
      return alert("해당 날짜에 이미 등록된 가격 정보가 있습니다.");

    setDailyPrices([newEntry, ...dailyPrices]);
    setPriceForm({ ...priceForm, price: "" });
  };

  const menuItems = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "거래관리",
    "종목마스터",
    "일별종가",
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans">
      {/* 상단 요약 바 생략 (이전 코드와 동일) */}

      <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* 네비게이션 */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 overflow-x-auto scrollbar-hide">
          {menuItems.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 text-[11px] font-bold transition-all ${activeTab === tab ? "bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === "일별종가" && (
            <div className="animate-in fade-in duration-500">
              {/* 종가 입력 섹션 */}
              <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
                  Update Daily Price
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      value={priceForm.date}
                      onChange={(e) =>
                        setPriceForm({ ...priceForm, date: e.target.value })
                      }
                      className="w-full bg-white border-slate-200 border p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Stock (보유종목)
                    </label>
                    <select
                      value={priceForm.ticker}
                      onChange={(e) =>
                        setPriceForm({ ...priceForm, ticker: e.target.value })
                      }
                      className="w-full bg-white border-slate-200 border p-3 rounded-xl text-xs font-bold outline-none"
                    >
                      {masterList.map((stock) => (
                        <option key={stock.ticker} value={stock.ticker}>
                          {stock.name} ({stock.ticker})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Closing Price
                    </label>
                    <input
                      type="number"
                      value={priceForm.price}
                      onChange={(e) =>
                        setPriceForm({ ...priceForm, price: e.target.value })
                      }
                      placeholder="0"
                      className="w-full bg-white border-slate-200 border p-3 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddPrice}
                    className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                  >
                    가격 등록
                  </button>
                </div>
              </div>

              {/* 종가 리스트 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-tighter">
                      <th className="pb-4 px-4">기준일</th>
                      <th className="pb-4">티커</th>
                      <th className="pb-4">종목명</th>
                      <th className="pb-4 text-right px-10">종가 (Price)</th>
                      <th className="pb-4 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[11px]">
                    {dailyPrices.map((p, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-slate-500">
                          {p.date}
                        </td>
                        <td className="py-4 font-medium text-slate-400">
                          {p.ticker}
                        </td>
                        <td className="py-4 font-black text-slate-700">
                          {p.name}
                        </td>
                        <td className="py-4 text-right px-10 font-black text-blue-600">
                          {p.price.toLocaleString()}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() =>
                              setDailyPrices(
                                dailyPrices.filter((_, i) => i !== index),
                              )
                            }
                            className="text-slate-300 hover:text-rose-500"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
