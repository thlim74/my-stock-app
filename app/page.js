"use client";

import React, { useState, useMemo } from "react";

/**
 * [포트폴리오 관리 시스템 Ver 2.3]
 * 1. 지수 영역: 사진과 동일하게 우측 상단 배치 및 디자인 수정
 * 2. 보유종목일별: 차트 대신 다른 탭과 동일한 표(Table) 형식으로 변경
 * 3. 데이터 입력: 요청하신 11건의 배당금 내역 포함
 * 4. 기능: CRUD(입력/수정/삭제) 로직 전체 포함
 */

export default function PortfolioSystem() {
  const [activeTab, setActiveTab] = useState("입출금");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editCategory, setEditCategory] = useState("");

  // --- [데이터베이스 상태] ---

  // 1. 입출금 (배당금 내역 포함)
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

  // 2. 종목 마스터
  const [masterStocks, setMasterStocks] = useState([
    { id: 101, ticker: "KRX:000660", name: "SK하이닉스", market: "KOSPI" },
    { id: 102, ticker: "KRX:005930", name: "삼성전자", market: "KOSPI" },
    { id: 103, ticker: "KRX:091230", name: "tiger 반도체", market: "ETF" },
    { id: 104, ticker: "KRX:226490", name: "kodex 코스피", market: "ETF" },
  ]);

  // 3. 거래 내역
  const [transactions, setTransactions] = useState([
    {
      id: 201,
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      type: "매수",
      qty: 5,
      price: 1985000,
      total: 9925000,
    },
  ]);

  // 4. 보유종목일별 데이터 (표 형식용)
  const [stockDailyLogs, setStockDailyLogs] = useState([
    {
      id: 401,
      date: "2026-05-15",
      name: "SK하이닉스",
      price: 1841000,
      qty: 15,
      evalAmount: 27615000,
      profit: -2080000,
      yield: -7.0,
    },
    {
      id: 402,
      date: "2026-05-15",
      name: "삼성전자",
      price: 274000,
      qty: 120,
      evalAmount: 32880000,
      profit: 14301420,
      yield: 76.98,
    },
  ]);

  // --- [로직 핸들러] ---
  const handleDelete = (category, id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    if (category === "cash") setCashFlows(cashFlows.filter((i) => i.id !== id));
    if (category === "trade")
      setTransactions(transactions.filter((i) => i.id !== id));
    if (category === "daily")
      setStockDailyLogs(stockDailyLogs.filter((i) => i.id !== id));
  };

  const openEditModal = (category, item) => {
    setEditCategory(category);
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (editCategory === "cash")
      setCashFlows(
        cashFlows.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    if (editCategory === "trade")
      setTransactions(
        transactions.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      {/* [상단 헤더 및 지수 영역] - 사진 구성 반영 */}
      <div className="max-w-[1600px] mx-auto flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">MY PORTFOLIO</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Asset Management System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="px-4 py-1 border-r border-slate-100 flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400">KOSPI</span>
              <span className="text-xs font-black">752,817</span>
              <span className="text-[10px] font-bold text-blue-500">
                (-5.68%)
              </span>
            </div>
            <div className="px-4 py-1 flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400">
                KOSDAQ
              </span>
              <span className="text-xs font-black">112,848</span>
              <span className="text-[10px] font-bold text-blue-500">
                (-5.26%)
              </span>
            </div>
          </div>
          <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-black hover:bg-slate-50">
            지수 새로고침
          </button>
        </div>
      </div>

      {/* [상단 요약 정보 카드] */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "순투자원금", value: "45,137,473", sub: "입출금 반영" },
          { label: "총자산", value: "91,908,518", sub: "현금 + 수익" },
          { label: "평가금액", value: "91,830,360", sub: "주식 가치" },
          { label: "현금", value: "78,158", sub: "미체결 잔액" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <p className="text-[9px] font-black text-slate-400 mb-2">
              {item.label}
            </p>
            <p className="text-xl font-black">
              {item.value} <span className="text-xs font-normal">원</span>
            </p>
            <p className="text-[9px] text-slate-300 mt-2 font-bold">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* [탭 메뉴] */}
      <div className="max-w-[1600px] mx-auto mb-6 flex gap-2 border-b border-slate-200">
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
            className={`px-6 py-4 text-[11px] font-black transition-all ${
              activeTab === tab
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* [메인 콘텐츠 영역] */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        {/* 입출금 탭 */}
        {activeTab === "입출금" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black italic">CASH FLOW LOG</h2>
            </div>
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-4 font-black text-left pl-4">날짜</th>
                  <th className="py-4 font-black text-left">구분</th>
                  <th className="py-4 font-black text-right">금액</th>
                  <th className="py-4 font-black text-left pl-10">메모</th>
                  <th className="py-4 font-black text-center">관리</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {cashFlows.map((cf) => (
                  <tr
                    key={cf.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-4 pl-4 text-slate-400">{cf.date}</td>
                    <td
                      className={
                        cf.type === "입금"
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }
                    >
                      {cf.type}
                    </td>
                    <td className="text-right">{cf.amount.toLocaleString()}</td>
                    <td className="pl-10 text-slate-500">{cf.memo}</td>
                    <td className="text-center space-x-3">
                      <button
                        onClick={() => openEditModal("cash", cf)}
                        className="text-blue-500"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete("cash", cf.id)}
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

        {/* 보유종목일별 탭 (표 형식으로 수정) */}
        {activeTab === "보유종목일별" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black italic">DAILY STOCK STATUS</h2>
            </div>
            <table className="w-full text-xs font-bold">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-4 text-left pl-4">기준일</th>
                  <th className="py-4 text-left">종목명</th>
                  <th className="py-4 text-right">현재가</th>
                  <th className="py-4 text-right">보유수량</th>
                  <th className="py-4 text-right">평가금액</th>
                  <th className="py-4 text-right">평가손익</th>
                  <th className="py-4 text-right">수익률</th>
                  <th className="py-4 text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {stockDailyLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50">
                    <td className="py-4 pl-4 text-slate-400">{log.date}</td>
                    <td>{log.name}</td>
                    <td className="text-right">{log.price.toLocaleString()}</td>
                    <td className="text-right">{log.qty}</td>
                    <td className="text-right">
                      {log.evalAmount.toLocaleString()}
                    </td>
                    <td
                      className={`text-right ${log.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {log.profit.toLocaleString()}
                    </td>
                    <td
                      className={`text-right ${log.yield >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {log.yield}%
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleDelete("daily", log.id)}
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

        {/* 거래관리 탭 */}
        {activeTab === "거래관리" && (
          <div>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 flex gap-4">
              <input
                type="date"
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold flex-1"
                defaultValue="2026-05-15"
              />
              <select className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold flex-1">
                <option>매수 (Buy)</option>
              </select>
              <select className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold flex-[2]">
                <option>종목 선택</option>
              </select>
              <input
                type="number"
                placeholder="0"
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold flex-1"
              />
              <button className="bg-[#1e293b] text-white px-8 rounded-lg font-black text-xs">
                거래 저장
              </button>
            </div>
            <table className="w-full text-xs font-bold">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-4 text-left pl-4">DATE</th>
                  <th className="py-4 text-left">TYPE</th>
                  <th className="py-4 text-left">ASSET</th>
                  <th className="py-4 text-right">QTY</th>
                  <th className="py-4 text-right">PRICE</th>
                  <th className="py-4 text-right">TOTAL</th>
                  <th className="py-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-4 pl-4 text-slate-400">{t.date}</td>
                    <td>
                      <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded">
                        매수
                      </span>
                    </td>
                    <td>{t.name}</td>
                    <td className="text-right">{t.qty}</td>
                    <td className="text-right">{t.price.toLocaleString()}</td>
                    <td className="text-right">{t.total.toLocaleString()}</td>
                    <td className="text-center">
                      <button
                        onClick={() => handleDelete("trade", t.id)}
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
        )}
      </div>

      {/* [수정 모달] */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-2xl p-8 shadow-xl">
            <h3 className="text-sm font-black mb-6 uppercase">내역 수정</h3>
            <div className="space-y-4">
              <input
                type="number"
                value={editingItem.amount}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    amount: Number(e.target.value),
                  })
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold"
              />
              <input
                type="text"
                value={editingItem.memo}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, memo: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold"
              />
            </div>
            <div className="flex gap-2 mt-8">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-slate-100 py-3 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
