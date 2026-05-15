"use client";

import React, { useState, useMemo, useEffect } from "react";

/**
 * [MY PORTFOLIO TOTAL ENTERPRISE SYSTEM - FULL VERSION]
 * - 컨셉: 가독성 극대화, 부피 축소, 상용 앱 수준의 세부 탭 구현
 * - 줄번호 안내를 위한 전체 코드 구성
 */

export default function MyPortfolioEnterpriseSystem() {
  // --- [1. 상태 관리 (STATE)] ---
  const [activeTab, setActiveTab] = useState("거래관리");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // 종목 마스터 등에서 사용

  // --- [2. 시장 지수 데이터 (5열 고정)] ---
  // [약 20-30라인]
  const [marketIndices] = useState([
    { name: "코스피", price: "752,817", change: "-5.68%", up: false },
    { name: "코스닥", price: "112,848", change: "-5.26%", up: false },
    { name: "S&P 500", price: "5,222.68", change: "+0.12%", up: true },
    { name: "나스닥", price: "16,384.47", change: "+0.34%", up: true },
    { name: "다우존스", price: "39,127.14", change: "-0.11%", up: false },
  ]);

  // --- [3. 통합 자산 요약 (SUMMARY)] ---
  // [약 35-45라인]
  const summary = useMemo(
    () => ({
      principal: 45137473,
      totalAssets: 97605788,
      evalAmount: 97527630,
      cash: 78158,
      netProfit: 52468315,
      totalYield: 116.24,
      dailyProfit: -500420,
    }),
    [],
  );

  // --- [4. 탭별 메인 데이터셋 (상세 버전)] ---
  // [약 50-130라인]
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-05-10",
      type: "매수",
      name: "삼성전자",
      ticker: "005930",
      qty: 10,
      price: 72000,
      fee: 350,
      total: 720350,
    },
    {
      id: 2,
      date: "2026-04-20",
      type: "매도",
      name: "SK하이닉스",
      ticker: "000660",
      qty: 5,
      price: 185000,
      fee: 250,
      total: 924750,
    },
  ]);

  const [monthlyStats] = useState([
    {
      month: "2026-05",
      sDate: "2026-05-01",
      eDate: "2026-05-15",
      sEval: 77986020,
      eEval: 91880010,
      flow: 61831,
      profit: 13863827,
      yield: 17.78,
      cumProfit: 46812779,
    },
    {
      month: "2026-04",
      sDate: "2026-04-01",
      eDate: "2026-04-30",
      sEval: 55040000,
      eEval: 77986020,
      flow: 7036,
      profit: 22920761,
      yield: 41.64,
      cumProfit: 32948952,
    },
    {
      month: "2026-03",
      sDate: "2026-03-03",
      eDate: "2026-03-31",
      sEval: 61753120,
      eEval: 55040000,
      flow: -1617055,
      profit: -8330331,
      yield: -13.49,
      cumProfit: 10028191,
    },
  ]);

  const [cashFlows] = useState([
    {
      id: 1,
      date: "2026-05-06",
      type: "입금",
      amount: 4914,
      memo: "Ai핵심 배당금",
      category: "Dividend",
    },
    {
      id: 2,
      date: "2026-05-06",
      type: "입금",
      amount: 16880,
      memo: "반도체 배당금",
      category: "Dividend",
    },
    {
      id: 3,
      date: "2026-05-06",
      type: "입금",
      amount: 70200,
      memo: "코스피 배당금",
      category: "Dividend",
    },
    {
      id: 4,
      date: "2026-04-24",
      type: "입금",
      amount: 13125,
      memo: "하이닉스배당금",
      category: "Dividend",
    },
    {
      id: 5,
      date: "2026-04-17",
      type: "입금",
      amount: 19170,
      memo: "삼성배당금",
      category: "Dividend",
    },
    {
      id: 6,
      date: "2026-03-04",
      type: "입금",
      amount: 156,
      memo: "plus고배당 배당",
      category: "Dividend",
    },
    {
      id: 7,
      date: "2026-02-03",
      type: "입금",
      amount: 4088,
      memo: "tiger반도체 배당",
      category: "Dividend",
    },
    {
      id: 8,
      date: "2026-02-03",
      type: "입금",
      amount: 2080,
      memo: "kodex200배당",
      category: "Dividend",
    },
    {
      id: 9,
      date: "2026-01-05",
      type: "입금",
      amount: 2360,
      memo: "은선물 배당",
      category: "Dividend",
    },
    {
      id: 10,
      date: "2025-12-24",
      type: "입금",
      amount: 3000,
      memo: "메타 배당금",
      category: "Dividend",
    },
    {
      id: 11,
      date: "2025-12-16",
      type: "입금",
      amount: 1500,
      memo: "알파벳 배당금",
      category: "Dividend",
    },
  ]);

  const [stockMaster] = useState([
    {
      ticker: "005930",
      name: "삼성전자",
      market: "KOSPI",
      sector: "반도체",
      currency: "KRW",
    },
    {
      ticker: "000660",
      name: "SK하이닉스",
      market: "KOSPI",
      sector: "반도체",
      currency: "KRW",
    },
    {
      ticker: "091230",
      name: "TIGER 차이나전기차",
      market: "ETF",
      sector: "2차전지",
      currency: "KRW",
    },
    {
      ticker: "NVDA",
      name: "NVIDIA",
      market: "NASDAQ",
      sector: "AI/GPU",
      currency: "USD",
    },
  ]);

  // --- [5. 유틸리티 (UTILITIES)] ---
  const formatNum = (num) => num?.toLocaleString();
  const getYieldColor = (val) => (val >= 0 ? "text-rose-500" : "text-blue-500");

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans tracking-tight">
      <div className="max-w-[1850px] mx-auto">
        {/* [HEADER SECTION] - [약 150-170라인] */}
        <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-slate-800">
              MY PORTFOLIO
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Asset Management & Tracking System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right border-r pr-5 border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                System Status
              </p>
              <p className="text-[11px] font-black text-emerald-500 flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                OPERATIONAL
              </p>
            </div>
            <button
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => setIsSyncing(false), 1000);
              }}
              className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-[11px] font-black hover:bg-slate-50 shadow-sm transition-all"
            >
              {isSyncing ? "Syncing..." : "지수 새로고침"}
            </button>
          </div>
        </div>

        {/* [MARKET INDICES] - [약 180-210라인] */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {marketIndices.map((idx, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-slate-300 transition-all"
            >
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400">
                  {idx.name}
                </p>
                <p className="text-lg font-black tracking-tighter">
                  {idx.price}
                </p>
              </div>
              <div
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.change}
              </div>
            </div>
          ))}
        </div>

        {/* [ASSET SUMMARY CARDS] - [약 220-250라인] */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "순투자원금",
              val: summary.principal,
              sub: "입출금 반영",
              color: "text-slate-800",
            },
            {
              label: "총자산(현금포함)",
              val: summary.totalAssets,
              sub: "현금 + 수익",
              color: "text-[#1e293b]",
            },
            {
              label: "평가금액",
              val: summary.evalAmount,
              sub: "주식 가치",
              color: "text-[#1e293b]",
            },
            {
              label: "현금보유",
              val: summary.cash,
              sub: "미체결 잔액",
              color: "text-[#1e293b]",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 relative group overflow-hidden"
            >
              <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-tighter">
                {card.label}
              </p>
              <div className="flex items-baseline gap-1.5 relative z-10">
                <span className={`text-2xl font-black ${card.color}`}>
                  {formatNum(card.val)}
                </span>
                <span className="text-[11px] font-bold text-slate-300 uppercase">
                  원
                </span>
              </div>
              <p className="text-[9px] text-slate-300 font-bold mt-4 uppercase tracking-widest">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* [MAIN SYSTEM INTERFACE] - [약 260라인 시작] */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden min-h-[750px] flex flex-col">
          {/* NAVIGATION BAR */}
          <div className="flex bg-slate-50/50 p-2.5 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {[
              "보유현황",
              "일별수익률",
              "보유종목일별",
              "월별수익률",
              "입출금",
              "거래관리",
              "종목마스터",
              "일별종가",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-7 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[#1e293b] text-white shadow-lg translate-y-[-1px]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-10 flex-grow">
            {/* 1. 거래관리 (NEW TRANSACTION) - [약 280-330라인] */}
            {activeTab === "거래관리" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-10 p-7 border border-slate-100 rounded-[24px] flex gap-5 items-end shadow-sm bg-white">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-slate-200"
                      defaultValue="2026-05-15"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                      Type
                    </label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none">
                      <option>매수 (Buy)</option>
                      <option>매도 (Sell)</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                      Select Asset
                    </label>
                    <input
                      type="text"
                      placeholder="종목 선택"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                      Qty
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="w-36 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                      placeholder="0"
                    />
                  </div>
                  <button className="bg-[#1e293b] text-white px-10 py-3.5 rounded-xl text-[11px] font-black hover:bg-black transition-all shadow-md">
                    거래 저장
                  </button>
                </div>

                <table className="w-full text-[12px] font-bold text-left border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="pb-5 pl-4">Date</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right pr-4">Price</th>
                      <th className="text-right pr-4">Total Amount</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-5 pl-4 text-slate-400">{t.date}</td>
                        <td>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${t.type === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="text-sm font-black text-slate-800">
                          {t.name}{" "}
                          <span className="text-[10px] text-slate-300 font-bold ml-1">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="text-center font-black">{t.qty}</td>
                        <td className="text-right pr-4">
                          {formatNum(t.price)}
                        </td>
                        <td className="text-right pr-4 font-black text-[#1e293b]">
                          {formatNum(t.total)}
                        </td>
                        <td className="text-center">
                          <button className="text-slate-200 hover:text-rose-400 transition-colors">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. 보유현황 - [약 340-390라인] */}
            {activeTab === "보유현황" && (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-4 gap-4 mb-10">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      평가손익
                    </p>
                    <p
                      className={`text-xl font-black ${getYieldColor(summary.netProfit)}`}
                    >
                      {formatNum(summary.netProfit)} 원
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      수익률
                    </p>
                    <p
                      className={`text-xl font-black ${getYieldColor(summary.totalYield)}`}
                    >
                      {summary.totalYield}%
                    </p>
                  </div>
                </div>
                <table className="w-full text-[12px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-4">Ticker</th>
                      <th>Asset Name</th>
                      <th>Qty</th>
                      <th>Avg Price</th>
                      <th>Current</th>
                      <th>Valuation</th>
                      <th>Profit/Loss</th>
                      <th>Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-6 text-blue-500 font-black uppercase">
                        KRX:005930
                      </td>
                      <td className="text-sm font-black text-slate-800">
                        삼성전자
                      </td>
                      <td className="text-slate-800">120</td>
                      <td className="text-right pr-6">{formatNum(72500)}</td>
                      <td className="text-right pr-6 font-black text-slate-800">
                        {formatNum(78500)}
                      </td>
                      <td className="text-right pr-6 font-black">
                        {formatNum(9420000)}
                      </td>
                      <td className="text-right pr-6 text-rose-500">
                        +720,000
                      </td>
                      <td className="text-right pr-4 text-rose-500">+8.28%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. 일별수익률 - [약 400-440라인] */}
            {activeTab === "일별수익률" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-[12px] font-bold text-center border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-5">Date</th>
                      <th>End Assets</th>
                      <th>Cash Flow</th>
                      <th>Daily P/L</th>
                      <th>Yield</th>
                      <th>Total P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-6 text-slate-400">2026-05-15</td>
                      <td className="text-right pr-8 font-black text-slate-800">
                        {formatNum(91958168)}
                      </td>
                      <td className="text-right pr-8 text-blue-500">0</td>
                      <td className="text-right pr-8 text-blue-500">
                        -500,420
                      </td>
                      <td className="text-right pr-8 text-blue-500">-0.54%</td>
                      <td className="text-right pr-6 font-black italic">
                        {formatNum(46820695)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. 입출금 (배당금 포함 11건) - [약 450-490라인] */}
            {activeTab === "입출금" && (
              <div className="animate-in fade-in duration-500 px-4">
                <div className="flex justify-between items-center mb-8 border-l-4 border-[#1e293b] pl-4">
                  <h3 className="text-lg font-black italic">
                    CASH FLOW HISTORY
                  </h3>
                  <button className="text-[10px] font-black bg-slate-100 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-200 uppercase">
                    Export CSV
                  </button>
                </div>
                <table className="w-full text-[12px] font-bold border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 text-left uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="pb-5">Date</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                      <th className="pl-16">Memo / Description</th>
                      <th className="text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cashFlows.map((cf) => (
                      <tr
                        key={cf.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-5 text-slate-400">{cf.date}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${cf.type === "입금" ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {cf.type}
                          </span>
                        </td>
                        <td className="text-right font-black text-slate-800">
                          {formatNum(cf.amount)}
                        </td>
                        <td className="pl-16 text-slate-500 font-medium">
                          {cf.memo}
                        </td>
                        <td className="text-right text-[10px] text-slate-300 font-black uppercase italic">
                          {cf.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. 월별수익률 (보정수익률 로직 반영) - [약 500-550라인] */}
            {activeTab === "월별수익률" && (
              <div className="animate-in fade-in duration-500">
                <table className="w-full text-[11px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-5">Month</th>
                      <th>Period</th>
                      <th>Start Assets</th>
                      <th>End Assets</th>
                      <th>Flow</th>
                      <th>Monthly P/L</th>
                      <th>Yield</th>
                      <th>Accumulated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {monthlyStats.map((m, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-6 font-black text-slate-800 text-sm">
                          {m.month}
                        </td>
                        <td className="text-[10px] text-slate-400 font-medium">
                          {m.sDate} ~ {m.eDate}
                        </td>
                        <td className="text-right pr-6">
                          {formatNum(m.sEval)}
                        </td>
                        <td className="text-right pr-6 font-black text-slate-800">
                          {formatNum(m.eEval)}
                        </td>
                        <td className="text-right pr-6 text-blue-500">
                          {formatNum(m.flow)}
                        </td>
                        <td
                          className={`text-right pr-6 font-black ${getYYieldColor(m.profit)}`}
                        >
                          {formatNum(m.profit)}
                        </td>
                        <td
                          className={`text-right pr-6 text-sm ${getYYieldColor(m.yield)}`}
                        >
                          {m.yield}%
                        </td>
                        <td className="text-right pr-4 font-black italic text-[#1e293b]">
                          {formatNum(m.cumProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. 종목마스터 (CRUD UI 포함) - [약 560-630라인] */}
            {activeTab === "종목마스터" && (
              <div className="animate-in zoom-in-95 duration-500 grid grid-cols-3 gap-6">
                {stockMaster.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all group relative"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          {s.ticker}
                        </p>
                        <h4 className="text-base font-black text-slate-800">
                          {s.name}
                        </h4>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded border border-slate-100 uppercase">
                            {s.market}
                          </span>
                          <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase">
                            {s.sector}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between h-12">
                      <p className="text-[10px] font-black text-slate-300 italic">
                        {s.currency}
                      </p>
                      <button className="text-slate-200 group-hover:text-slate-400 transition-colors text-xs">
                        ⚙️
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-slate-100 rounded-[28px] flex flex-col items-center justify-center p-8 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-500 transition-colors mb-2">
                    ＋
                  </div>
                  <p className="text-[10px] font-black text-slate-300 group-hover:text-slate-500 uppercase">
                    Add New Stock
                  </p>
                </div>
              </div>
            )}

            {/* 7. 일별종가 (Price Tracker) - [약 640-720라인] */}
            {activeTab === "일별종가" && (
              <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-500">
                <div className="bg-[#1e293b] p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <h3 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">
                      Market Price Synchronizer
                    </h3>
                    <p className="text-slate-400 text-xs font-medium mb-12 tracking-wide uppercase">
                      Real-time valuation engine for global stock exchanges
                    </p>

                    <div className="flex gap-10 mb-12">
                      <div className="text-center px-10 border-r border-white/10">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">
                          South Korea / KRX
                        </p>
                        <p className="text-2xl font-black">2026-05-15</p>
                      </div>
                      <div className="text-center px-10">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">
                          United States / NYSE
                        </p>
                        <p className="text-2xl font-black">2026-05-15</p>
                      </div>
                    </div>

                    <button className="bg-white text-slate-900 px-12 py-4 rounded-2xl font-black text-[11px] hover:bg-slate-100 transition-all shadow-xl uppercase tracking-widest">
                      Full Database Refresh
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-black italic select-none">
                    SYNC
                  </div>
                </div>
              </div>
            )}

            {/* 8. 보유종목일별 - [약 730-780라인] */}
            {activeTab === "보유종목일별" && (
              <div className="animate-in slide-in-from-right-4 duration-500">
                <div className="flex gap-4 mb-8 items-center">
                  <input
                    type="date"
                    className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-bold outline-none"
                    defaultValue="2026-05-15"
                  />
                  <button className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-[11px] font-black shadow-sm">
                    Filter
                  </button>
                </div>
                <table className="w-full text-[12px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-4">Date</th>
                      <th>Asset Name</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Qty</th>
                      <th>Evaluation</th>
                      <th>P/L</th>
                      <th>Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-5 text-slate-400">2026-05-15</td>
                      <td className="text-sm font-black text-slate-800">
                        SK하이닉스
                      </td>
                      <td className="text-right pr-6">{formatNum(184100)}</td>
                      <td className="text-right pr-6 text-blue-500">-3,200</td>
                      <td>15</td>
                      <td className="text-right pr-6 font-black">
                        {formatNum(2761500)}
                      </td>
                      <td className={`text-right pr-6 text-blue-500`}>
                        -50,000
                      </td>
                      <td className={`text-right pr-4 text-blue-500`}>
                        -1.78%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* [GLOBAL FOOTER BAR] - [약 790-820라인] */}
          <div className="bg-[#1e293b] text-white p-5 px-12 flex justify-between items-center">
            <div className="flex gap-12">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5 tracking-widest">
                  Total Valuation
                </p>
                <p className="text-base font-black tracking-tighter">
                  {formatNum(summary.totalAssets)}{" "}
                  <span className="text-[10px] text-slate-500 italic">KRW</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5 tracking-widest">
                  Cash Reserved
                </p>
                <p className="text-base font-black tracking-tighter">
                  {formatNum(summary.cash)}{" "}
                  <span className="text-[10px] text-slate-500 italic">KRW</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5 tracking-widest">
                Performance
              </p>
              <p className="text-xs font-black text-rose-400">
                MARKET OUTPERFORM
              </p>
            </div>
          </div>
        </div>

        {/* [FINAL FOOTER] */}
        <div className="mt-10 pb-10 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
            © 2026 Asset Intelligence Pro. Full Stack Portfolio Management
            Solution.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        body {
          font-family:
            "Pretendard",
            -apple-system,
            BlinkMacSystemFont,
            system-ui,
            Roboto,
            sans-serif;
        }
      `}</style>
    </div>
  );
}
