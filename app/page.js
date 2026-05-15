"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState("보유현황");
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // 9개 메뉴 설정
  const menuItems = [
    "보유현황",
    "일별수익률",
    "월별수익률",
    "보유종목일별",
    "거래내역",
    "일별종가",
    "현금",
    "입력관리",
    "시스템상태",
  ];

  const fetchIndices = async () => {
    setLoadingIndices(true);
    try {
      const res = await fetch("/api/indices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setIndices(data);
      }
    } catch (e) {
      console.error("지수 로딩 에러");
    } finally {
      setLoadingIndices(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const timer = setInterval(fetchIndices, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
            My Portfolio
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
            Real-time Asset Management Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchIndices}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            {loadingIndices ? "갱신 중..." : "지수 새로고침"}
          </button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-700 transition-all">
            로그아웃
          </button>
        </div>
      </div>

      {/* 실시간 주가지수 영역 */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {loadingIndices && indices.length === 0
          ? Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse bg-slate-200 rounded-2xl"
                />
              ))
          : indices.map((idx, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md"
              >
                <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                  {idx.name}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-black text-slate-800 tracking-tighter">
                    {idx.value}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${idx.isUp ? "text-rose-500" : "text-blue-500"}`}
                  >
                    {idx.rate}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* 요약 카드 섹션 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "순투자원금", value: "45,137,473" },
          { label: "총자산", value: "97,605,788" },
          { label: "평가금액", value: "97,527,630" },
          { label: "현금", value: "78,158" },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
              {item.label}
            </p>
            <p className="text-xl font-black text-slate-800">
              {item.value}
              <span className="ml-1 text-xs font-medium text-slate-400">
                원
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 메인 메뉴 및 컨텐츠 */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-50 bg-slate-50/50 p-2 overflow-x-auto scrollbar-hide">
          {menuItems.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-[11px] font-black transition-all ${
                activeTab === tab
                  ? "bg-slate-800 text-white rounded-2xl shadow-lg transform scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === "보유현황" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50 uppercase tracking-tighter">
                    <th className="pb-4">Asset / Code</th>
                    <th className="pb-4 text-right">Qty</th>
                    <th className="pb-4 text-right">Avg Price</th>
                    <th className="pb-4 text-right">Current</th>
                    <th className="pb-4 text-right">Value</th>
                    <th className="pb-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="group">
                    <td className="py-5 font-black text-slate-800">
                      삼성전자{" "}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        005930
                      </span>
                    </td>
                    <td className="py-5 text-right font-medium">120</td>
                    <td className="py-5 text-right text-slate-500">154,821</td>
                    <td className="py-5 text-right font-black">293,250</td>
                    <td className="py-5 text-right font-bold text-slate-800">
                      35,190,000
                    </td>
                    <td className="py-5 text-right font-black text-rose-500">
                      +89.41%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "입력관리" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* 입력 폼 */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <input
                  type="date"
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100"
                />
                <select className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100">
                  <option>매수</option>
                  <option>매도</option>
                </select>
                <input
                  type="text"
                  placeholder="종목명"
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100"
                />
                <input
                  type="text"
                  placeholder="코드"
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100"
                />
                <input
                  type="number"
                  placeholder="수량"
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100"
                />
                <input
                  type="number"
                  placeholder="단가"
                  className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-100"
                />
                <button className="bg-slate-800 text-white rounded-xl font-black text-xs py-3 shadow-lg hover:bg-black transition-all">
                  추가하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
