"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("보유현황");
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

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

  // 2. 실시간 지수 데이터 가져오기 함수
  const fetchIndices = async () => {
    setLoadingIndices(true);
    try {
      const res = await fetch("/api/indices");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIndices(data);
    } catch (e) {
      console.error("지수 로딩 에러:", e);
    } finally {
      setLoadingIndices(false);
    }
  };

  // 초기 로딩 및 자동 갱신 설정
  useEffect(() => {
    fetchIndices();
    const timer = setInterval(fetchIndices, 60000); // 1분마다 갱신
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans">
      {/* 상단 헤더 섹션 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
            My Portfolio
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            동기화 데이터 기준: {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchIndices}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            {loadingIndices ? "갱신 중..." : "지수 새로고침"}
          </button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-700 transition-all">
            로그아웃
          </button>
        </div>
      </div>

      {/* 상단 지수 보드 (실시간 연동) */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {loadingIndices && indices.length === 0 ? (
          <div className="col-span-5 py-10 text-center text-slate-300 font-bold animate-pulse">
            마켓 데이터를 연결 중입니다...
          </div>
        ) : (
          indices.map((idx, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md"
            >
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">
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
          ))
        )}
      </div>

      {/* 자산 요약 섹션 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "순투자원금", value: "45,137,473" },
          { label: "총자산", value: "97,605,788" },
          { label: "평가금액", value: "97,527,630" },
          { label: "현금", value: "78,158" },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
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

      {/* 메인 컨텐츠 영역 (9개 탭 메뉴) */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-50 bg-slate-50/30 p-2 overflow-x-auto scrollbar-hide">
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
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50 text-left">
                    <th className="pb-4">종목명 / 코드</th>
                    <th className="pb-4 text-right">수량</th>
                    <th className="pb-4 text-right">평균단가</th>
                    <th className="pb-4 text-right">최근가</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="text-sm">
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Transaction Input
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <input
                    type="date"
                    className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <select className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none">
                    <option>매수</option>
                    <option>매도</option>
                  </select>
                  <input
                    type="text"
                    placeholder="종목명"
                    className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="코드"
                    className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="수량"
                    className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="단가"
                    className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <button className="bg-slate-800 text-white rounded-xl font-black text-xs py-3 hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all active:scale-95">
                    저장하기
                  </button>
                </div>
              </section>
              <div className="h-px bg-slate-50 shadow-inner" />
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-slate-300 uppercase border-b border-slate-50">
                      <tr>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Type</th>
                        <th className="pb-4">Asset</th>
                        <th className="pb-4 text-right">Qty</th>
                        <th className="pb-4 text-right">Price</th>
                        <th className="pb-4 text-right">Total</th>
                        <th className="pb-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="text-xs font-bold group hover:bg-slate-50/50">
                        <td className="py-4 text-slate-400">2024.05.14</td>
                        <td className="py-4 text-rose-500 uppercase">Buy</td>
                        <td className="py-4 text-slate-800">삼성전자</td>
                        <td className="py-4 text-right">10</td>
                        <td className="py-4 text-right text-slate-500">
                          72,000
                        </td>
                        <td className="py-4 text-right text-slate-800">
                          720,000
                        </td>
                        <td className="py-4 text-center">
                          <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === "일별종가" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-center py-20">
              <p className="text-slate-300 text-sm font-bold">
                보유 종목에 한해서만 실시간 데이터를 수집합니다.
              </p>
              <p className="text-[10px] text-slate-200 mt-2 uppercase tracking-widest">
                Only active holdings are tracked
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
