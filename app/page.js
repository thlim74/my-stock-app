"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  // 1. 요청하신 8개 메뉴로 수정 [보유현황, 일별수익률, 보유종목일별, 월별수익률, 입출금, 거래관리, 종목마스터, 일별종가]
  const [activeTab, setActiveTab] = useState("보유현황");
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

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

  const fetchIndices = async () => {
    setLoadingIndices(true);
    try {
      const res = await fetch("/api/indices");
      const data = await res.json();
      if (Array.isArray(data)) setIndices(data);
    } catch (e) {
      console.error("지수 로딩 실패");
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
      {/* 헤더 섹션 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
            My Portfolio
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
            Asset Management System
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchIndices}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            지수 새로고침
          </button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md">
            로그아웃
          </button>
        </div>
      </div>

      {/* 실시간 지수 카드 (미국지수 포함) */}
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
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
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
            ))}
      </div>

      {/* 메인 탭 메뉴 컨텐츠 */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* 탭 네비게이션 [8개 항목] */}
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
          {/* 1. 보유현황 */}
          {activeTab === "보유현황" && (
            <div className="animate-in fade-in duration-500">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50">
                    <th className="pb-4">종목/코드</th>
                    <th className="pb-4 text-right">수량</th>
                    <th className="pb-4 text-right">평단가</th>
                    <th className="pb-4 text-right">현재가</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="text-sm font-bold">
                    <td className="py-5">
                      삼성전자{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        005930
                      </span>
                    </td>
                    <td className="py-5 text-right">100</td>
                    <td className="py-5 text-right">70,000</td>
                    <td className="py-5 text-right">72,500</td>
                    <td className="py-5 text-right">7,250,000</td>
                    <td className="py-5 text-right text-rose-500">+3.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 2. 거래관리 (입력+내역 통합) */}
          {activeTab === "거래관리" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* 거래 입력 */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                  New Transaction
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <input
                    type="date"
                    className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <select className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none">
                    <option>매수</option>
                    <option>매도</option>
                  </select>
                  <input
                    type="text"
                    placeholder="종목명"
                    className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="코드"
                    className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="수량"
                    className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="단가"
                    className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                  />
                  <button className="bg-slate-800 text-white rounded-xl font-black text-xs py-3 shadow-lg hover:bg-black">
                    저장
                  </button>
                </div>
              </section>
              <div className="h-px bg-slate-50" />
              {/* 거래 내역 */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                  Transaction History
                </h3>
                <table className="w-full text-left text-xs font-bold">
                  <thead className="text-slate-300 border-b border-slate-50">
                    <tr>
                      <th className="pb-3">날짜</th>
                      <th className="pb-3">구분</th>
                      <th className="pb-3">종목</th>
                      <th className="pb-3 text-right">금액</th>
                      <th className="pb-3 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-4">2024.05.15</td>
                      <td className="py-4 text-rose-500">매수</td>
                      <td className="py-4">삼성전자</td>
                      <td className="py-4 text-right">7,200,000</td>
                      <td className="py-4 text-center">🗑️</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {/* 3. 입출금 */}
          {activeTab === "입출금" && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Cash Management
              </h3>
              <div className="flex gap-3">
                <input
                  type="date"
                  className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                />
                <select className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none">
                  <option>입금</option>
                  <option>출금</option>
                </select>
                <input
                  type="number"
                  placeholder="금액"
                  className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none"
                />
                <button className="bg-blue-600 text-white px-8 rounded-xl font-black text-xs">
                  확인
                </button>
              </div>
            </div>
          )}

          {/* 나머지 탭 (공통 안내) */}
          {!["보유현황", "거래관리", "입출금"].includes(activeTab) && (
            <div className="text-center py-20 animate-in fade-in duration-500">
              <p className="text-slate-300 font-bold text-sm">
                {activeTab} 페이지 준비 중입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
