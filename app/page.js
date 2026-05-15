"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("보유현황");
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // --- 종목마스터 관련 상태 추가 ---
  const [masterList, setMasterList] = useState([
    { ticker: "005930", name: "삼성전자", currency: "KRW" },
    { ticker: "000660", name: "SK하이닉스", currency: "KRW" },
  ]);
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState("KRW");
  const [isSearching, setIsSearching] = useState(false);

  // 8개 메뉴 설정 (요청하신 순서)
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

  // 지수 가져오기
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

  // --- 종목마스터: 티커 자동 찾기 로직 ---
  const handleAutoFind = async () => {
    if (!newTicker) return alert("티커(코드)를 입력해주세요.");
    setIsSearching(true);
    try {
      const res = await fetch(`/api/master/search?code=${newTicker}`);
      const data = await res.json();
      if (data.name) {
        setNewName(data.name); // 찾은 종목명을 입력창에 자동 세팅
      } else {
        alert("종목을 찾을 수 없습니다.");
      }
    } catch (e) {
      alert("조회 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- 종목마스터: 리스트 추가 로직 ---
  const handleAddMaster = () => {
    if (!newTicker || !newName) return alert("티커와 종목명을 확인해주세요.");
    const isDuplicate = masterList.some((item) => item.ticker === newTicker);
    if (isDuplicate) return alert("이미 등록된 종목입니다.");

    setMasterList([
      ...masterList,
      { ticker: newTicker, name: newName, currency: newCurrency },
    ]);
    setNewTicker("");
    setNewName("");
  };

  useEffect(() => {
    fetchIndices();
    const timer = setInterval(fetchIndices, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
      {/* 상단 헤더 & 지수 보드 (기존과 동일) */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
            My Portfolio
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
            Asset Management System
          </p>
        </div>
        <button
          onClick={fetchIndices}
          className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
        >
          지수 새로고침
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {indices.map((idx, i) => (
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

      {/* 메인 탭 영역 */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
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
          {/* 종목마스터 탭 구현부 */}
          {activeTab === "종목마스터" && (
            <div className="animate-in fade-in duration-500">
              {/* 상단 입력 섹션 */}
              <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl items-end border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Ticker (Code)
                  </label>
                  <input
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    placeholder="예: 005930"
                    className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Asset Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="종목명을 입력하거나 자동찾기"
                      className="flex-1 bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    />
                    <button
                      onClick={handleAutoFind}
                      disabled={isSearching}
                      className="bg-slate-200 px-4 rounded-xl text-[10px] font-black hover:bg-slate-300 transition-all disabled:opacity-50"
                    >
                      {isSearching ? "조회중" : "자동찾기"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Currency
                  </label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                  >
                    <option value="KRW">KRW (대한민국)</option>
                    <option value="USD">USD (미국)</option>
                  </select>
                </div>
                <button
                  onClick={handleAddMaster}
                  className="bg-slate-800 text-white rounded-xl font-black text-xs py-3.5 shadow-lg hover:bg-black transition-all"
                >
                  종목 리스트 추가
                </button>
              </div>

              {/* 종목 리스트 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50 uppercase tracking-tighter">
                      <th className="pb-4 px-4">Ticker</th>
                      <th className="pb-4">Asset Name</th>
                      <th className="pb-4 text-center">Currency</th>
                      <th className="pb-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {masterList.map((item, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[11px]">
                          {item.ticker}
                        </td>
                        <td className="py-4 font-black text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                            {item.currency}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() =>
                              setMasterList(
                                masterList.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-slate-300 hover:text-rose-500 transition-colors"
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

          {/* 타 탭은 기존 안내 메시지 유지 */}
          {activeTab !== "종목마스터" && (
            <div className="text-center py-20 text-slate-300 font-bold text-sm">
              {activeTab} 페이지 구현 내용이 들어갈 자리입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
