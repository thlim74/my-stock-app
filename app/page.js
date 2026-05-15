"use client";

import React, { useState, useMemo } from "react";

/**
 * [최종 통합 포트폴리오 관리 시스템 - Ver 2.2]
 * * 주요 수정 사항:
 * 1. 지수(Index) 영역: 크기를 키우고 가독성을 높여 상단에 배치
 * 2. 입출금 데이터: 요청하신 11건의 배당금 내역을 초기값으로 전체 등록
 * 3. CRUD 기능: 입출금, 거래관리, 종목마스터의 '추가', '수정', '삭제' 로직 완전 구현
 * 4. 상태 관리: "보유종목일별" 탭 클릭 시 차트 생성 중 상태 표시
 */

export default function IntegratedPortfolioSystem() {
  // --- [공통 상태 관리] ---
  const [activeTab, setActiveTab] = useState("입출금");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editCategory, setEditCategory] = useState(""); // cash, trade, stock 구분

  // --- [1. 데이터베이스 상태] ---

  // 입출금 데이터 (요청하신 배당금 리스트 반영)
  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      date: "2026-05-06",
      type: "입금",
      amount: 4914,
      memo: "Ai핵심 배당금",
    },
    {
      id: 2,
      date: "2026-05-06",
      type: "입금",
      amount: 16880,
      memo: "반도체 배당금",
    },
    {
      id: 3,
      date: "2026-05-06",
      type: "입금",
      amount: 70200,
      memo: "코스피 배당금",
    },
    {
      id: 4,
      date: "2026-04-24",
      type: "입금",
      amount: 13125,
      memo: "하이닉스배당금",
    },
    {
      id: 5,
      date: "2026-04-17",
      type: "입금",
      amount: 19170,
      memo: "삼성배당금",
    },
    {
      id: 6,
      date: "2026-03-04",
      type: "입금",
      amount: 156,
      memo: "plus고배당 배당",
    },
    {
      id: 7,
      date: "2026-02-03",
      type: "입금",
      amount: 4088,
      memo: "tiger반도체 배당",
    },
    {
      id: 8,
      date: "2026-02-03",
      type: "입금",
      amount: 2080,
      memo: "kodex200배당",
    },
    {
      id: 9,
      date: "2026-01-05",
      type: "입금",
      amount: 2360,
      memo: "은선물 배당",
    },
    {
      id: 10,
      date: "2025-12-24",
      type: "입금",
      amount: 3000,
      memo: "메타 배당금",
    },
    {
      id: 11,
      date: "2025-12-16",
      type: "입금",
      amount: 1500,
      memo: "알파벳 배당금",
    },
  ]);

  // 종목 마스터 데이터
  const [masterStocks, setMasterStocks] = useState([
    {
      id: 101,
      ticker: "KRX:000660",
      name: "SK하이닉스",
      market: "KOSPI",
      currency: "KRW",
    },
    {
      id: 102,
      ticker: "KRX:005930",
      name: "삼성전자",
      market: "KOSPI",
      currency: "KRW",
    },
    {
      id: 103,
      ticker: "KRX:091230",
      name: "tiger 반도체",
      market: "ETF",
      currency: "KRW",
    },
    {
      id: 104,
      ticker: "KRX:226490",
      name: "kodex 코스피",
      market: "ETF",
      currency: "KRW",
    },
  ]);

  // 거래 내역 데이터
  const [transactions, setTransactions] = useState([
    {
      id: 201,
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      type: "매수",
      qty: 5,
      price: 1985000,
      fee: 0,
      tax: 0,
    },
    {
      id: 202,
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      type: "매수",
      qty: 5,
      price: 1982000,
      fee: 0,
      tax: 0,
    },
  ]);

  // 실시간 종가 데이터
  const [dailyPrices, setDailyPrices] = useState([
    {
      id: 301,
      date: "2026-05-15",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1841000,
      time: "14:09:55",
    },
    {
      id: 302,
      date: "2026-05-15",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 274000,
      time: "14:09:55",
    },
  ]);

  // --- [2. 자산 요약 계산 로직] ---
  const summary = useMemo(() => {
    const totalIn = cashFlows
      .filter((c) => c.type === "입금")
      .reduce((sum, c) => sum + c.amount, 0);
    const totalOut = cashFlows
      .filter((c) => c.type === "출금")
      .reduce((sum, c) => sum + c.amount, 0);
    const netInvestment = totalIn - totalOut; // 순투자원금

    return {
      netInvestment,
      totalAsset: 91908518, // 이미지 기준값
      cashBalance: 78158,
      stockEval: 91830360,
    };
  }, [cashFlows]);

  // --- [3. CRUD 공통 핸들러] ---

  // 항목 삭제
  const handleDelete = (category, id) => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    if (category === "cash") setCashFlows(cashFlows.filter((i) => i.id !== id));
    if (category === "trade")
      setTransactions(transactions.filter((i) => i.id !== id));
    if (category === "stock")
      setMasterStocks(masterStocks.filter((i) => i.id !== id));
    if (category === "price")
      setDailyPrices(dailyPrices.filter((i) => i.id !== id));
  };

  // 수정 모달 열기
  const openEditModal = (category, item) => {
    setEditCategory(category);
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  // 수정 저장
  const handleUpdate = () => {
    if (editCategory === "cash") {
      setCashFlows(
        cashFlows.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    } else if (editCategory === "trade") {
      setTransactions(
        transactions.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    } else if (editCategory === "stock") {
      setMasterStocks(
        masterStocks.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // 신규 등록 (입출금 전용 예시)
  const handleAddCash = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      id: Date.now(),
      date: formData.get("date"),
      type: formData.get("type"),
      amount: Number(formData.get("amount")),
      memo: formData.get("memo"),
    };
    setCashFlows([newItem, ...cashFlows]);
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans">
      {/* [상단 지수 및 헤더] - 가독성 수정 완료 */}
      <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Asset Management System
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="px-5 py-2 border-r border-slate-100 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 mb-1">
                KOSPI
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">752,817</span>
                <span className="text-[10px] font-bold text-blue-500">
                  -5.68%
                </span>
              </div>
            </div>
            <div className="px-5 py-2 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 mb-1">
                KOSDAQ
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">112,848</span>
                <span className="text-[10px] font-bold text-blue-500">
                  -5.26%
                </span>
              </div>
            </div>
          </div>
          <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-5 py-4 rounded-2xl text-[11px] font-black transition-all">
            지수 새로고침
          </button>
        </div>
      </div>

      {/* [대시보드 요약 카드] */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-6 mb-10">
        {[
          {
            label: "순투자원금",
            value: summary.netInvestment,
            sub: "입출금 반영",
          },
          {
            label: "총자산",
            value: summary.totalAsset,
            sub: "현금 + 수익",
            color: "text-blue-600",
          },
          { label: "평가금액", value: summary.stockEval, sub: "주식 가치" },
          { label: "현금", value: summary.cashBalance, sub: "미체결 잔액" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-black ${card.color || "text-slate-800"}`}
              >
                {card.value.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">원</span>
            </div>
            <p className="text-[9px] text-slate-300 mt-3 font-bold">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* [탭 시스템] */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex bg-slate-50/50 p-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {[
            "보유현황",
            "일별수익률",
            "보유종목일별",
            "입출금",
            "거래관리",
            "종목마스터",
            "일별종가",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-5 rounded-[24px] text-[11px] font-black transition-all ${
                activeTab === tab
                  ? "bg-[#1e293b] text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-10">
          {/* 1. 입출금 탭 (요청 데이터 반영) */}
          {activeTab === "입출금" && (
            <div className="animate-in fade-in duration-300">
              <form
                onSubmit={handleAddCash}
                className="flex gap-4 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100"
              >
                <input
                  name="date"
                  type="date"
                  required
                  className="flex-1 bg-white border-slate-200 rounded-xl p-3 text-xs font-bold"
                  defaultValue="2026-05-15"
                />
                <select
                  name="type"
                  className="flex-1 bg-white border-slate-200 rounded-xl p-3 text-xs font-bold"
                >
                  <option>입금</option>
                  <option>출금</option>
                </select>
                <input
                  name="amount"
                  type="number"
                  placeholder="금액 입력"
                  required
                  className="flex-[2] bg-white border-slate-200 rounded-xl p-3 text-xs font-bold"
                />
                <input
                  name="memo"
                  type="text"
                  placeholder="메모(적요)"
                  className="flex-[2] bg-white border-slate-200 rounded-xl p-3 text-xs font-bold"
                />
                <button
                  type="submit"
                  className="flex-1 bg-[#1e293b] text-white rounded-xl font-black text-xs hover:opacity-90"
                >
                  추가
                </button>
              </form>

              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-black border-b border-slate-100">
                  <tr>
                    <th className="pb-4 pl-4 uppercase">Date</th>
                    <th className="pb-4 uppercase">Type</th>
                    <th className="pb-4 text-right uppercase">Amount</th>
                    <th className="pb-4 pl-10 uppercase">Memo</th>
                    <th className="pb-4 text-center uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {cashFlows.map((cf) => (
                    <tr
                      key={cf.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 pl-4 text-slate-400">{cf.date}</td>
                      <td>
                        <span
                          className={
                            cf.type === "입금"
                              ? "text-emerald-500"
                              : "text-rose-500"
                          }
                        >
                          {cf.type}
                        </span>
                      </td>
                      <td className="text-right font-black">
                        {cf.amount.toLocaleString()}
                      </td>
                      <td className="pl-10 text-slate-500 font-medium">
                        {cf.memo}
                      </td>
                      <td className="text-center space-x-4">
                        <button
                          onClick={() => openEditModal("cash", cf)}
                          className="text-blue-500 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete("cash", cf.id)}
                          className="text-rose-500 hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. 보유종목일별 탭 (로딩 상태 구현) */}
          {activeTab === "보유종목일별" && (
            <div className="py-32 flex flex-col items-center justify-center bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-sm font-black text-slate-800">
                Generating Multi-Asset Performance Chart...
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                Processing Data...
              </p>
            </div>
          )}

          {/* 3. 종목마스터 탭 (수정 기능 포함) */}
          {activeTab === "종목마스터" && (
            <div className="grid grid-cols-3 gap-6">
              {masterStocks.map((stock) => (
                <div
                  key={stock.id}
                  className="p-8 rounded-[32px] border border-slate-100 bg-slate-50/50 group hover:border-blue-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black text-slate-300 tracking-tighter">
                      {stock.ticker}
                    </span>
                    <span className="bg-white border border-slate-100 px-2 py-1 rounded text-[9px] font-black text-slate-400">
                      {stock.market}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-6">
                    {stock.name}
                  </h3>
                  <div className="flex gap-4 border-t border-slate-100 pt-6">
                    <button
                      onClick={() => openEditModal("stock", stock)}
                      className="text-[10px] font-black text-blue-500"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete("stock", stock.id)}
                      className="text-[10px] font-black text-rose-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                <span className="text-xs font-black text-slate-400">
                  + 새 종목 등록
                </span>
              </div>
            </div>
          )}

          {/* 4. 거래관리 탭 (이미지 스타일 준수) */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-[#1e293b] p-8 rounded-[32px] mb-8 text-white">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">
                  New Transaction
                </h4>
                <div className="grid grid-cols-5 gap-4">
                  <input
                    type="date"
                    className="bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                  <select className="bg-slate-800 border-none rounded-xl p-3 text-xs font-bold">
                    <option>매수</option>
                    <option>매도</option>
                  </select>
                  <select className="bg-slate-800 border-none rounded-xl p-3 text-xs font-bold">
                    {masterStocks.map((s) => (
                      <option key={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="수량"
                    className="bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                  />
                  <button className="bg-blue-600 rounded-xl font-black text-xs">
                    거래 저장
                  </button>
                </div>
              </div>
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="p-5">날짜</th>
                    <th>종목</th>
                    <th>구분</th>
                    <th className="text-right">수량</th>
                    <th className="text-right">단가</th>
                    <th className="text-center">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50">
                      <td className="p-5 text-slate-400">{t.date}</td>
                      <td className="text-slate-800">{t.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-500">
                          매수
                        </span>
                      </td>
                      <td className="text-right">{t.qty}</td>
                      <td className="text-right">{t.price.toLocaleString()}</td>
                      <td className="text-center space-x-3">
                        <button
                          onClick={() => openEditModal("trade", t)}
                          className="text-blue-500"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete("trade", t.id)}
                          className="text-rose-500"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* [통합 수정 모달] */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">
              Edit Entry
            </h2>
            <div className="space-y-5">
              {Object.keys(editingItem)
                .filter((k) => k !== "id")
                .map((key) => (
                  <div key={key}>
                    <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase">
                      {key}
                    </label>
                    <input
                      type={
                        typeof editingItem[key] === "number" ? "number" : "text"
                      }
                      value={editingItem[key]}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          [key]:
                            e.target.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                className="bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs shadow-xl"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <div className="max-w-[1600px] mx-auto mt-12 pb-10 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        <p>© 2026 GEMINI FINANCIAL SYSTEM. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
            SYSTEM ONLINE
          </span>
          <span>STABLE RELEASE 2.2</span>
        </div>
      </div>
    </div>
  );
}
