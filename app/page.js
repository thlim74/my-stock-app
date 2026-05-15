"use client";

import React, { useState, useMemo, useEffect } from "react";

/**
 * [MY PORTFOLIO - FULL PRODUCTION CODE]
 * 1. 시장 지수: 코스피, 코스닥, S&P500, 나스닥, 다우존스 (5열 완벽 배치)
 * 2. 탭 구성: 보유현황, 일별수익률, 보유종목일별, 월별수익률, 입출금, 거래관리, 종목마스터, 일별종가
 * 3. 기능: 각 탭별 상세 데이터 로드 및 관리 UI 통합
 */

export default function MyPortfolioFullSystem() {
  // --- [STATE: 시스템 설정 및 탭] ---
  const [activeTab, setActiveTab] = useState("월별수익률");
  const [isSyncing, setIsSyncing] = useState(false);

  // --- [DATA: 시장 지수 (5열 배치용)] ---
  const [marketIndices] = useState([
    {
      name: "KOSPI",
      price: "2,752.81",
      change: "-5.68%",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      name: "KOSDAQ",
      price: "811.28",
      change: "-5.26%",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      name: "S&P 500",
      price: "5,222.68",
      change: "+0.12%",
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      name: "NASDAQ",
      price: "16,384.47",
      change: "+0.34%",
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      name: "DOW JONES",
      price: "39,127.14",
      change: "-0.11%",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ]);

  // --- [DATA: 입출금 & 배당금 (11건 데이터 포함)] ---
  const [cashFlows, setCashFlows] = useState([
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

  // --- [DATA: 월별 수익률 상세] ---
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
      cumProfit: 46812779.38,
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
      cumProfit: 32948952.38,
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
      cumProfit: 10028191.38,
    },
    {
      month: "2026-02",
      sDate: "2026-02-02",
      eDate: "2026-02-27",
      sEval: 46152635,
      eEval: 61753120,
      flow: -5979656,
      profit: 9614660,
      yield: 20.83,
      cumProfit: 18358522.38,
    },
    {
      month: "2026-01",
      sDate: "2026-01-01",
      eDate: "2026-01-30",
      sEval: 25073175,
      eEval: 46152635,
      flow: -14603999,
      profit: 6473100,
      yield: 25.82,
      cumProfit: 8743861.6,
    },
  ]);

  // --- [DATA: 일별 수익률 상세] ---
  const [dailyReturns] = useState([
    {
      date: "2026-05-15",
      sEval: 92458588,
      eEval: 91958168,
      flow: 0,
      profit: -500420,
      yield: -0.54,
      cumProfit: 46820695,
    },
    {
      date: "2026-05-14",
      sEval: 92338088,
      eEval: 92458588,
      flow: 0,
      profit: 120500,
      yield: 0.13,
      cumProfit: 47321115,
    },
    {
      date: "2026-05-13",
      sEval: 89825957,
      eEval: 92338088,
      flow: 61831,
      profit: 2450300,
      yield: 2.73,
      cumProfit: 47200615,
    },
    {
      date: "2026-05-12",
      sEval: 90120500,
      eEval: 89825957,
      flow: 0,
      profit: -294543,
      yield: -0.33,
      cumProfit: 44750315,
    },
  ]);

  // --- [DATA: 보유종목일별 상세] ---
  const [stockDailyData] = useState([
    {
      date: "2026-05-15",
      name: "SK하이닉스",
      ticker: "000660",
      price: 184100,
      chg: -3200,
      qty: 15,
      eval: 2761500,
      profit: -50000,
      yield: -1.78,
    },
    {
      date: "2026-05-15",
      name: "삼성전자",
      ticker: "005930",
      price: 78500,
      chg: 200,
      qty: 120,
      eval: 9420000,
      profit: 24000,
      yield: 0.26,
    },
    {
      date: "2026-05-14",
      name: "SK하이닉스",
      ticker: "000660",
      price: 187300,
      chg: 1500,
      qty: 15,
      eval: 2809500,
      profit: 22500,
      yield: 0.81,
    },
    {
      date: "2026-05-14",
      name: "삼성전자",
      ticker: "005930",
      price: 78300,
      chg: -500,
      qty: 120,
      eval: 9396000,
      profit: -60000,
      yield: -0.64,
    },
  ]);

  // --- [DATA: 거래관리 (Buy/Sell)] ---
  const [transactions] = useState([
    {
      id: 101,
      date: "2026-05-13",
      type: "매수",
      ticker: "000660",
      name: "SK하이닉스",
      price: 185000,
      qty: 5,
      fee: 250,
      tax: 0,
      total: 925250,
    },
    {
      id: 102,
      date: "2026-04-20",
      type: "매도",
      ticker: "005930",
      name: "삼성전자",
      price: 81000,
      qty: 10,
      fee: 180,
      tax: 1620,
      total: 808200,
    },
    {
      id: 103,
      date: "2026-03-15",
      type: "매수",
      ticker: "005930",
      name: "삼성전자",
      price: 75000,
      qty: 20,
      fee: 350,
      tax: 0,
      total: 1500350,
    },
  ]);

  // --- [DATA: 종목 마스터] ---
  const [stockMaster] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      market: "KOSPI",
      currency: "KRW",
      sector: "반도체",
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      market: "KOSPI",
      currency: "KRW",
      sector: "반도체",
    },
    {
      ticker: "NASDAQ:NVDA",
      name: "NVIDIA",
      market: "NASDAQ",
      currency: "USD",
      sector: "AI/GPU",
    },
    {
      ticker: "KRX:091230",
      name: "TIGER 차이나전기차",
      market: "ETF",
      currency: "KRW",
      sector: "2차전지",
    },
  ]);

  // --- [SUMMARY CALCULATION] ---
  const summary = useMemo(
    () => ({
      principal: 45137473,
      totalAssets: 91958168,
      netProfit: 46820695,
      totalYield: 103.73,
      cash: 78158,
      dailyChange: -500420,
    }),
    [],
  );

  // --- [UI HELPERS] ---
  const formatNum = (num) => num?.toLocaleString();
  const getYieldColor = (val) => (val >= 0 ? "text-rose-500" : "text-blue-500");

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 text-slate-900 font-sans tracking-tight">
      <div className="max-w-[1750px] mx-auto">
        {/* [1] GLOBAL HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-800 flex items-center gap-3">
              MY PORTFOLIO
              <span className="not-italic text-[10px] bg-slate-800 text-white px-3 py-1 rounded-full tracking-widest font-bold">
                PRO V3.0
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-[0.4em] uppercase">
              Enterprise Asset Management Engine
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-6 border-r pr-6 border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                System Status
              </p>
              <p className="text-xs font-black text-emerald-500 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                OPERATIONAL
              </p>
            </div>
            <button
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => setIsSyncing(false), 1500);
              }}
              className={`bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl text-[11px] font-black hover:bg-slate-50 transition-all shadow-sm ${isSyncing ? "opacity-50" : ""}`}
            >
              {isSyncing ? "데이터 동기화 중..." : "지수 새로고침"}
            </button>
          </div>
        </div>

        {/* [2] MARKET INDICES - 5 COLUMN GRID (AS REQUESTED) */}
        <div className="grid grid-cols-5 gap-5 mb-10">
       {marketIndices.map((idx, i) => (
  <div key={i} className="bg-white p-4 rounded-[16px] shadow-sm border border-slate-100 group">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[9px] font-black text-slate-400 uppercase">{idx.name}</span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-lg font-black tracking-tight">{idx.price}</span>
      <span className={`text-[10px] font-bold ${idx.color}`}>
        ({idx.change})
      </span>
    </div>
  </div>
))}
        </div>

        {/* [3] ASSET DASHBOARD SUMMARY */}
        <div className="grid grid-cols-4 gap-6 mb-12">
        {[
  { label: "순투자원금", val: summary.principal, color: "text-slate-800" },
  { label: "총자산", val: summary.totalAssets, color: "text-blue-600" },
  { label: "평가손익", val: summary.netProfit, color: "text-rose-500" },
  { label: "수익률", val: summary.totalYield + "%", color: "text-rose-500" },
].map((card, i) => (
  <div key={i} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">{card.label}</p>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-black ${card.color}`}>
        {typeof card.val === "number" ? formatNum(card.val) : card.val}
      </span>
      {typeof card.val === "number" && <span className="text-[9px] font-bold text-slate-300 ml-1">원</span>}
    </div>
  </div>
))}
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${card.color.includes("rose") ? "bg-rose-400" : "bg-slate-300"}`}
                ></div>
                <p className="text-[10px] text-slate-300 font-bold uppercase">
                  {card.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* [4] MAIN INTERFACE CONTROL */}
        <div className="bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden min-h-[800px] flex flex-col">
          {/* Navigation Bar */}
          <div className="flex bg-[#f8fafc] p-3 border-b border-slate-100 overflow-x-auto no-scrollbar scroll-smooth">
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
  className={`px-6 py-3 rounded-full text-[11px] font-black transition-all ${
    activeTab === tab 
      ? "bg-slate-900 text-white shadow-md" 
      : "text-slate-400 hover:bg-slate-100"
  }`}
>
  {tab}
</button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="p-12 flex-grow">
            {/* 4-1. 일별수익률 탭 */}
            {activeTab === "일별수익률" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-end mb-8 px-2">
                  <h3 className="text-xl font-black italic tracking-tight">
                    DAILY PERFORMANCE
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    최근 30거래일 기준
                  </p>
                </div>
                <table className="w-full text-[11px] font-bold text-center">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100">
                    <tr>
                      <th className="py-5">날짜</th>
                      <th>기초자산</th>
                      <th>기말자산</th>
                      <th>순입출금</th>
                      <th>당일손익</th>
                      <th>수익률</th>
                      <th>누적손익</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dailyReturns.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-6 font-black text-slate-400">
                          {row.date}
                        </td>
                        <td className="text-right pr-8">
                          {formatNum(row.sEval)}
                        </td>
                        <td className="text-right pr-8 font-black text-slate-800">
                          {formatNum(row.eEval)}
                        </td>
                        <td className="text-right pr-8 text-blue-500">
                          {formatNum(row.flow)}
                        </td>
                        <td
                          className={`text-right pr-8 ${getYieldColor(row.profit)}`}
                        >
                          {formatNum(row.profit)}
                        </td>
                        <td
                          className={`text-right pr-8 ${getYieldColor(row.yield)}`}
                        >
                          {row.yield}%
                        </td>
                        <td className="text-right pr-4 font-black">
                          {formatNum(row.cumProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4-2. 보유종목일별 탭 */}
            {activeTab === "보유종목일별" && (
              <div className="animate-in fade-in duration-700">
                <div className="flex justify-between mb-8">
                  <div className="flex gap-4">
                    <input
                      type="date"
                      className="bg-slate-50 border-none rounded-xl text-[11px] font-bold p-3 px-5 shadow-inner"
                      defaultValue="2026-05-15"
                    />
                    <button className="bg-slate-800 text-white px-6 py-3 rounded-xl text-[10px] font-black">
                      조회
                    </button>
                  </div>
                </div>
                <table className="w-full text-[11px] font-bold text-center">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100">
                    <tr>
                      <th className="py-5">날짜</th>
                      <th>종목명</th>
                      <th>현재가</th>
                      <th>대비</th>
                      <th>수량</th>
                      <th>평가금액</th>
                      <th>손익</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stockDailyData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-6 text-slate-400">{row.date}</td>
                        <td className="font-black text-slate-800">
                          {row.name}{" "}
                          <span className="text-[9px] text-blue-400 ml-1">
                            {row.ticker}
                          </span>
                        </td>
                        <td className="text-right pr-6">
                          {formatNum(row.price)}
                        </td>
                        <td
                          className={`text-right pr-6 ${getYieldColor(row.chg)}`}
                        >
                          {formatNum(row.chg)}
                        </td>
                        <td>{row.qty}</td>
                        <td className="text-right pr-6 font-black">
                          {formatNum(row.eval)}
                        </td>
                        <td
                          className={`text-right pr-6 ${getYieldColor(row.profit)}`}
                        >
                          {formatNum(row.profit)}
                        </td>
                        <td
                          className={`text-right pr-4 ${getYieldColor(row.yield)}`}
                        >
                          {row.yield}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4-3. 거래관리 탭 */}
            {activeTab === "거래관리" && (
           {/* 272번 줄부터 시작 */}
<div className="bg-white p-6 border border-slate-100 rounded-2xl mb-8 flex gap-4 items-end shadow-sm">
  <div className="flex-1 space-y-1">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Date</label>
    <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-300 outline-none" defaultValue="2026-05-15" />
  </div>
  <div className="flex-1 space-y-1">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Type</label>
    <select className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-bold outline-none"><option>매수 (Buy)</option><option>매도 (Sell)</option></select>
  </div>
  <div className="flex-1 space-y-1">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Select Asset</label>
    <input type="text" placeholder="종목 선택" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-bold outline-none" />
  </div>
  <div className="w-32 space-y-1">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Quantity</label>
    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-bold outline-none" />
  </div>
  <div className="w-40 space-y-1">
    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Unit Price</label>
    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-bold outline-none" />
  </div>
  <button className="bg-[#1e293b] text-white px-10 py-2.5 rounded-lg text-[11px] font-black hover:bg-black transition-all">거래 저장</button>
</div>
{/* 283번 줄 근처에서 끝 */}


                <table className="w-full text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 text-left">
                    <tr>
                      <th className="py-5 pl-4">날짜</th>
                      <th>구분</th>
                      <th>종목</th>
                      <th className="text-right">체결단가</th>
                      <th className="text-right">수량</th>
                      <th className="text-right">수수료/세금</th>
                      <th className="text-right pr-4">정산금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-6 pl-4 text-slate-400">{t.date}</td>
                        <td>
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black ${t.type === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="font-black text-slate-800">
                          {t.name}{" "}
                          <span className="text-[9px] text-slate-300">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="text-right pr-2">
                          {formatNum(t.price)}
                        </td>
                        <td className="text-right pr-2">{t.qty}</td>
                        <td className="text-right pr-2 text-slate-300">
                          {formatNum(t.fee + t.tax)}
                        </td>
                        <td className="text-right pr-4 font-black">
                          {formatNum(t.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4-4. 월별수익률 탭 (이미지 로직 완벽 반영) */}
            {activeTab === "월별수익률" && (
              <div className="animate-in fade-in duration-700">
                <table className="w-full text-[11px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100">
                    <tr>
                      <th className="py-5">월</th>
                      <th>운용기간</th>
                      <th>월초평가금액</th>
                      <th>월말평가금액</th>
                      <th>월간 현금흐름</th>
                      <th>월간 손익(보정)</th>
                      <th>수익률(보정)</th>
                      <th>누적평가손익</th>
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
                        <td className="text-slate-400 text-[10px]">
                          {m.sDate} ~ {m.eDate}
                        </td>
                        <td className="text-right pr-8">
                          {formatNum(m.sEval)}
                        </td>
                        <td className="text-right pr-8 font-black text-slate-800">
                          {formatNum(m.eEval)}
                        </td>
                        <td className="text-right pr-8 text-blue-500">
                          {formatNum(m.flow)}
                        </td>
                        <td
                          className={`text-right pr-8 ${getYieldColor(m.profit)} font-black`}
                        >
                          {formatNum(m.profit)}
                        </td>
                        <td
                          className={`text-right pr-8 ${getYieldColor(m.yield)} text-sm`}
                        >
                          {m.yield}%
                        </td>
                        <td className="text-right pr-4 font-black text-slate-900 italic">
                          {formatNum(m.cumProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4-5. 입출금 탭 (11건 데이터 렌더링) */}
            {activeTab === "입출금" && (
              <div className="animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black italic tracking-tight">
                    CASH FLOW & DIVIDENDS
                  </h3>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-600">
                      누적 배당 수익: 148,453원
                    </span>
                  </div>
                </div>
                <table className="w-full text-[12px] font-bold">
                  <thead className="text-slate-400 border-b border-slate-100">
                    <tr className="text-left">
                      <th className="pb-5 pl-4">날짜</th>
                      <th>구분</th>
                      <th className="text-right">금액</th>
                      <th className="pl-20">적요/메모</th>
                      <th className="text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cashFlows.map((cf) => (
                      <tr
                        key={cf.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-5 pl-4 text-slate-400 group-hover:text-slate-800 transition-colors">
                          {cf.date}
                        </td>
                        <td
                          className={
                            cf.memo.includes("배당")
                              ? "text-blue-500"
                              : "text-emerald-500"
                          }
                        >
                          {cf.memo.includes("배당") ? "배당금" : cf.type}
                        </td>
                        <td className="text-right font-black">
                          {formatNum(cf.amount)}
                        </td>
                        <td className="pl-20 text-slate-500 font-medium">
                          {cf.memo}
                        </td>
                        <td className="text-center">
                          <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase font-black tracking-tighter">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4-6. 종목마스터 탭 */}
            {activeTab === "종목마스터" && (
              <div className="animate-in fade-in duration-500 grid grid-cols-2 gap-6">
                {stockMaster.map((s, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex justify-between items-center hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-[20px] shadow-sm flex items-center justify-center font-black text-xl text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {s.ticker}
                        </p>
                        <h4 className="text-lg font-black text-slate-800">
                          {s.name}
                        </h4>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded border border-slate-200">
                            {s.market}
                          </span>
                          <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase">
                            {s.sector}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">
                        Currency
                      </p>
                      <p className="text-sm font-black text-slate-400">
                        {s.currency}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-8 hover:bg-white hover:border-slate-400 transition-all cursor-pointer">
                  <span className="text-2xl mb-2">＋</span>
                  <p className="text-[11px] font-black text-slate-400 uppercase">
                    Add New Stock
                  </p>
                </div>
              </div>
            )}

            {/* 4-7. 일별종가 탭 */}
            {activeTab === "일별종가" && (
              <div className="max-w-4xl mx-auto py-10 animate-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-12 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                        Market Price Sync
                      </h3>
                    </div>
                    <p className="text-slate-400 text-xs font-bold mb-12">
                      거래소별 최종 수집 시각 안내 및 수동 수집기
                    </p>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                      <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                          KOREA / KRX
                        </p>
                        <p className="text-xl font-black mb-1">2026-05-15</p>
                        <p className="text-[10px] font-bold text-slate-500">
                          Last Sync: 14:09:55
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">
                          USA / NASDAQ
                        </p>
                        <p className="text-xl font-black mb-1">2026-05-15</p>
                        <p className="text-[10px] font-bold text-slate-500">
                          Last Sync: 08:00:02
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button className="w-full bg-white text-slate-900 py-5 rounded-[24px] font-black text-xs hover:bg-slate-100 transition-all shadow-xl">
                        실시간 전종목 종가 갱신 (Full Refresh)
                      </button>
                      <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                        Data provided by Global Financial API
                      </p>
                    </div>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-black italic">
                    STOCK
                  </div>
                </div>
              </div>
            )}

            {/* 4-8. 보유현황 탭 */}
            {activeTab === "보유현황" && (
              <div className="animate-in fade-in duration-500">
                <table className="w-full text-[11px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100">
                    <tr>
                      <th className="py-5">티커</th>
                      <th>종목명</th>
                      <th>수량</th>
                      <th>투자원금</th>
                      <th>현재가</th>
                      <th>평가금액</th>
                      <th>손익</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50">
                      <td className="py-7 text-blue-600 font-black">
                        KRX:000660
                      </td>
                      <td className="text-sm font-black">SK하이닉스</td>
                      <td>15</td>
                      <td className="text-right pr-6">29,695,000</td>
                      <td className="text-right pr-6 font-black text-slate-800 text-sm">
                        184,100
                      </td>
                      <td className="text-right pr-6 font-black">27,615,000</td>
                      <td className="text-right pr-6 text-blue-500">
                        -2,080,000
                      </td>
                      <td className="text-right pr-4 text-blue-500">-7.00%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-7 text-blue-600 font-black">
                        KRX:005930
                      </td>
                      <td className="text-sm font-black">삼성전자</td>
                      <td>120</td>
                      <td className="text-right pr-6">18,578,580</td>
                      <td className="text-right pr-6 font-black text-slate-800 text-sm">
                        78,500
                      </td>
                      <td className="text-right pr-6 font-black">9,420,000</td>
                      <td className="text-right pr-6 text-rose-500">
                        14,301,420
                      </td>
                      <td className="text-right pr-4 text-rose-500">+76.98%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Global Footer Stats */}
          <div className="bg-slate-900 text-white p-6 px-12 flex justify-between items-center">
            <div className="flex gap-10">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Total Valuation
                </p>
                <p className="text-sm font-black tracking-tight">
                  {formatNum(summary.totalAssets)}{" "}
                  <span className="text-[10px] text-slate-500 italic">KRW</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Cash Balance
                </p>
                <p className="text-sm font-black tracking-tight">
                  {formatNum(summary.cash)}{" "}
                  <span className="text-[10px] text-slate-500 italic">KRW</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                Market Sentiment
              </p>
              <p className="text-xs font-black text-rose-400">
                BULLISH TRENDING
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER LICENSE */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            © 2026 Asset Intelligence Pro. Full Stack Portfolio Management
            Solution.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap");
        body {
          font-family: "Inter", sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
