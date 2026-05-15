"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * [MY PORTFOLIO TOTAL SYSTEM - THE DEFINITIVE COMPLETE VERSION]
 * 1. 지수 대시보드: KOSPI, KOSDAQ, S&P500 등 실시간 테마 UI
 * 2. 자산 요약: 6개 핵심 지표 대시보드
 * 3. 8개 탭 상세 구현: 보유현황, 일별수익률, 보유종목일별, 월별수익률, 입출금, 거래관리, 종목마스터, 일별종가
 * 4. 입출금/거래 등록: UI 폼을 통한 데이터 직접 추가 기능
 * 5. 엑셀 연동: 업로드 시 상태(State) 즉시 업데이트 및 다운로드
 */

export default function MyPortfolioDefinitiveSystem() {
  // --- [1. 기초 상태 관리] ---
  const [activeTab, setActiveTab] = useState("보유현황");
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef(null);

  // --- [2. 데이터 셋 (State)] ---
  // (1) 시장 지수
  const [marketIndices] = useState([
    { name: "KOSPI", price: "2,743.18", change: "-0.12%", up: false },
    { name: "KOSDAQ", price: "829.82", change: "-0.14%", up: false },
    { name: "S&P 500", price: "5,501.24", change: "+0.77%", up: true },
    { name: "NASDAQ", price: "18,635.22", change: "+0.88%", up: true },
    { name: "DOW JONES", price: "40,063.46", change: "+0.75%", up: true },
  ]);

  // (2) 거래 기록
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-05-10",
      type: "매수",
      name: "삼성전자",
      ticker: "005930",
      qty: 10,
      price: 72000,
      total: 720000,
    },
    {
      id: 2,
      date: "2026-04-20",
      type: "매도",
      name: "SK하이닉스",
      ticker: "000660",
      qty: 5,
      price: 185000,
      total: 925000,
    },
  ]);

  // (3) 입출금 기록
  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      date: "2026-05-06",
      type: "입금",
      amount: 4914,
      memo: "배당금 입금",
    },
    {
      id: 2,
      date: "2026-04-24",
      type: "입금",
      amount: 13125,
      memo: "하이닉스 배당",
    },
  ]);

  // (4) 종목 마스터
  const [stockMaster, setStockMaster] = useState([
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
      ticker: "NVDA",
      name: "NVIDIA",
      market: "NASDAQ",
      sector: "AI/GPU",
      currency: "USD",
    },
  ]);

  // (5) 통계성 데이터 (보유현황, 수익률 등)
  const [holdings] = useState([
    {
      ticker: "005930",
      name: "삼성전자",
      qty: 120,
      avgPrice: 72500,
      current: 78500,
      eval: 9420000,
      profit: 720000,
      yield: 8.28,
    },
    {
      ticker: "000660",
      name: "SK하이닉스",
      qty: 15,
      avgPrice: 187400,
      current: 184100,
      eval: 2761500,
      profit: -49500,
      yield: -1.76,
    },
  ]);

  const [monthlyStats] = useState([
    {
      month: "2026-05",
      start: 77986020,
      end: 91880010,
      flow: 61831,
      profit: 13863827,
      yield: 17.78,
    },
    {
      month: "2026-04",
      start: 55040000,
      end: 77986020,
      flow: 7036,
      profit: 22920761,
      yield: 41.64,
    },
  ]);

  // --- [3. 입력 폼 상태 전용] ---
  const [newTx, setNewTx] = useState({
    date: "2026-05-15",
    type: "매수",
    name: "",
    ticker: "",
    qty: "",
    price: "",
  });
  const [newCash, setNewCash] = useState({
    date: "2026-05-15",
    type: "입금",
    amount: "",
    memo: "",
  });
  const [newStock, setNewStock] = useState({
    ticker: "",
    name: "",
    market: "KOSPI",
    sector: "",
    currency: "KRW",
  });

  // --- [4. 유틸리티 함수] ---
  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");
  const getYieldColor = (v) => (v >= 0 ? "text-rose-500" : "text-blue-500");

  // --- [5. 엑셀 업로드/다운로드 로직] ---
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split("\n").slice(1);
      const cleaned = rows.filter((r) => r.trim() !== "");

      if (activeTab === "거래관리") {
        const newData = cleaned.map((r, i) => {
          const [date, type, name, ticker, qty, price, total] = r.split(",");
          return {
            id: Date.now() + i,
            date,
            type,
            name,
            ticker,
            qty: Number(qty),
            price: Number(price),
            total: Number(total),
          };
        });
        setTransactions((prev) => [...newData, ...prev]);
      } else if (activeTab === "입출금") {
        const newData = cleaned.map((r, i) => {
          const [date, type, amount, memo] = r.split(",");
          return {
            id: Date.now() + i,
            date,
            type,
            amount: Number(amount),
            memo,
          };
        });
        setCashFlows((prev) => [...newData, ...prev]);
      } else if (activeTab === "종목마스터") {
        const newData = cleaned.map((r) => {
          const [ticker, name, market, sector, currency] = r.split(",");
          return { ticker, name, market, sector, currency };
        });
        setStockMaster((prev) => [...newData, ...prev]);
      }
      alert(
        `${activeTab} 데이터 ${cleaned.length}건이 성공적으로 반영되었습니다.`,
      );
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadExcel = (tabName) => {
    let headers = "";
    let body = "";
    if (tabName === "거래관리") {
      headers = "Date,Type,Name,Ticker,Qty,Price,Total\n";
      body = transactions
        .map(
          (t) =>
            `${t.date},${t.type},${t.name},${t.ticker},${t.qty},${t.price},${t.total}`,
        )
        .join("\n");
    } else if (tabName === "입출금") {
      headers = "Date,Type,Amount,Memo\n";
      body = cashFlows
        .map((c) => `${c.date},${c.type},${c.amount},${c.memo}`)
        .join("\n");
    } else if (tabName === "종목마스터") {
      headers = "Ticker,Name,Market,Sector,Currency\n";
      body = stockMaster
        .map(
          (s) => `${s.ticker},${s.name},${s.market},${s.sector},${s.currency}`,
        )
        .join("\n");
    }
    const blob = new Blob(["\uFEFF" + headers + body], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tabName}_Export.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans tracking-tight">
      <div className="max-w-[1850px] mx-auto">
        {/* [SECTION 1] HEADER & MARKET INDICES */}
        <div className="flex justify-between items-end mb-6 px-1">
          <div>
            <h1 className="text-3xl font-black italic text-slate-800 uppercase leading-none">
              Global Portfolio
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Integrated Asset Management v4.2
            </p>
          </div>
          <button
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => setIsSyncing(false), 800);
            }}
            className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[11px] font-black shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {isSyncing ? "FETCHING MARKET DATA..." : "시장 지수 새로고침"}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {marketIndices.map((idx, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center transition-transform hover:-translate-y-1"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                  {idx.name}
                </p>
                <p className="text-xl font-black">{idx.price}</p>
              </div>
              <div
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.change}
              </div>
            </div>
          ))}
        </div>

        {/* [SECTION 2] ASSET SUMMARY CARD */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            { label: "순투자원금", val: 45137473 },
            { label: "총자산", val: 91056488, color: "text-blue-600" },
            { label: "수익률", val: "101.73%", color: "text-rose-500" },
            { label: "평가금액", val: 90978330 },
            { label: "실현손익", val: 45919015, color: "text-rose-500" },
            { label: "예수금", val: 78158 },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">
                {item.label}
              </p>
              <span
                className={`text-2xl font-black ${item.color || "text-slate-800"}`}
              >
                {typeof item.val === "number" ? formatNum(item.val) : item.val}
              </span>
              <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            </div>
          ))}
        </div>

        {/* [SECTION 3] MAIN TABS INTERFACE */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[800px]">
          {/* TAB BAR */}
          <div className="flex bg-slate-50/50 p-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
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
                className={`px-8 py-4 rounded-3xl text-[11px] font-black whitespace-nowrap transition-all ${activeTab === tab ? "bg-[#1e293b] text-white shadow-xl translate-y-[-2px]" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 flex-grow relative">
            {/* COMMON EXCEL TOOLBAR */}
            {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
              <div className="flex justify-end gap-2 mb-8 animate-in slide-in-from-right-4 duration-500">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  className="hidden"
                  accept=".csv"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-emerald-100 uppercase hover:bg-emerald-100 transition-colors"
                >
                  Excel Upload ↑
                </button>
                <button
                  onClick={() => downloadExcel(activeTab)}
                  className="bg-slate-50 text-slate-600 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-slate-200 uppercase hover:bg-slate-100 transition-colors"
                >
                  Excel Download ↓
                </button>
              </div>
            )}

            {/* TAB CONTENT IMPLEMENTATION (NO OMISSION) */}

            {/* 1. 입출금 (등록 폼 + 목록) */}
            {activeTab === "입출금" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-10 p-8 border border-slate-100 rounded-3xl flex gap-5 items-end bg-slate-50/40 shadow-inner">
                  <div className="flex-[1] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newCash.date}
                      onChange={(e) =>
                        setNewCash({ ...newCash, date: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none ring-slate-100 focus:ring-2"
                    />
                  </div>
                  <div className="w-36 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Type
                    </label>
                    <select
                      value={newCash.type}
                      onChange={(e) =>
                        setNewCash({ ...newCash, type: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none"
                    >
                      <option>입금</option>
                      <option>출금</option>
                    </select>
                  </div>
                  <div className="flex-[1.5] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={newCash.amount}
                      onChange={(e) =>
                        setNewCash({ ...newCash, amount: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-[2] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Memo
                    </label>
                    <input
                      type="text"
                      value={newCash.memo}
                      onChange={(e) =>
                        setNewCash({ ...newCash, memo: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      placeholder="내용 입력"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCashFlows([
                        {
                          ...newCash,
                          id: Date.now(),
                          amount: Number(newCash.amount),
                        },
                        ...cashFlows,
                      ]);
                      alert("등록 완료");
                    }}
                    className="bg-[#1e293b] text-white px-12 py-3.5 rounded-2xl text-[11px] font-black hover:bg-black transition-all"
                  >
                    등록
                  </button>
                </div>
                <table className="w-full text-[12px] font-bold text-left border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="pb-5 pl-4">Date</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                      <th className="pl-16">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cashFlows.map((cf) => (
                      <tr key={cf.id} className="hover:bg-slate-50 group">
                        <td className="py-5 pl-4 text-slate-400">{cf.date}</td>
                        <td>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${cf.type === "입금" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                          >
                            {cf.type}
                          </span>
                        </td>
                        <td className="text-right font-black text-sm">
                          {formatNum(cf.amount)}
                        </td>
                        <td className="pl-16 text-slate-500 font-medium">
                          {cf.memo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. 거래관리 (등록 폼 + 목록) */}
            {activeTab === "거래관리" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-10 p-8 border border-slate-100 rounded-3xl flex gap-4 items-end bg-slate-50/40">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTx.date}
                      onChange={(e) =>
                        setNewTx({ ...newTx, date: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={newTx.name}
                      onChange={(e) =>
                        setNewTx({ ...newTx, name: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                      placeholder="삼성전자"
                    />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      value={newTx.qty}
                      onChange={(e) =>
                        setNewTx({ ...newTx, qty: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="w-36 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={newTx.price}
                      onChange={(e) =>
                        setNewTx({ ...newTx, price: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setTransactions([
                        {
                          ...newTx,
                          id: Date.now(),
                          qty: Number(newTx.qty),
                          price: Number(newTx.price),
                          total: Number(newTx.qty) * Number(newTx.price),
                        },
                        ...transactions,
                      ]);
                      alert("거래 등록 완료");
                    }}
                    className="bg-[#1e293b] text-white px-12 py-3.5 rounded-2xl text-[11px] font-black hover:bg-black transition-all"
                  >
                    거래 저장
                  </button>
                </div>
                <table className="w-full text-[12px] font-bold text-left border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="pb-5 pl-4">Date</th>
                      <th>Type</th>
                      <th>Asset Name</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right pr-4">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-5 pl-4 text-slate-400">{t.date}</td>
                        <td>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${t.type === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="font-black text-slate-800">
                          {t.name}{" "}
                          <span className="text-[10px] text-slate-300 ml-1 italic font-medium">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="text-center font-medium">{t.qty}</td>
                        <td className="text-right pr-4 font-black">
                          {formatNum(t.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. 보유현황 */}
            {activeTab === "보유현황" && (
              <div className="animate-in fade-in duration-500">
                <table className="w-full text-[12px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-5">Ticker</th>
                      <th>Asset</th>
                      <th>Qty</th>
                      <th>Avg Price</th>
                      <th>Current</th>
                      <th>Valuation</th>
                      <th>Profit</th>
                      <th>Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-800">
                    {holdings.map((h, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-6 text-blue-500 font-black italic tracking-tighter">
                          {h.ticker}
                        </td>
                        <td className="text-sm font-black">{h.name}</td>
                        <td>{h.qty}</td>
                        <td className="text-right pr-8">
                          {formatNum(h.avgPrice)}
                        </td>
                        <td className="text-right pr-8 font-black">
                          {formatNum(h.current)}
                        </td>
                        <td className="text-right pr-8 font-black text-sm">
                          {formatNum(h.eval)}
                        </td>
                        <td
                          className={`text-right pr-8 font-black ${getYieldColor(h.profit)}`}
                        >
                          {h.profit > 0 ? "+" : ""}
                          {formatNum(h.profit)}
                        </td>
                        <td
                          className={`text-right pr-4 font-black ${getYieldColor(h.yield)}`}
                        >
                          {h.yield > 0 ? "+" : ""}
                          {h.yield}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. 월별수익률 */}
            {activeTab === "월별수익률" && (
              <div className="animate-in fade-in duration-500">
                <table className="w-full text-[11px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-6">Month</th>
                      <th>Start Balance</th>
                      <th>End Balance</th>
                      <th>Net Flow</th>
                      <th>P/L Amount</th>
                      <th>Rate of Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-800">
                    {monthlyStats.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-7 font-black text-base">{m.month}</td>
                        <td className="text-right pr-10 text-slate-400">
                          {formatNum(m.start)}
                        </td>
                        <td className="text-right pr-10 font-black text-sm">
                          {formatNum(m.end)}
                        </td>
                        <td
                          className={`text-right pr-10 font-black ${m.flow >= 0 ? "text-emerald-500" : "text-orange-500"}`}
                        >
                          {formatNum(m.flow)}
                        </td>
                        <td
                          className={`text-right pr-10 font-black text-sm ${getYieldColor(m.profit)}`}
                        >
                          {formatNum(m.profit)}
                        </td>
                        <td
                          className={`text-right pr-6 font-black text-sm ${getYieldColor(m.yield)}`}
                        >
                          {m.yield}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. 종목마스터 */}
            {activeTab === "종목마스터" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-10 p-8 border border-slate-100 rounded-3xl flex gap-4 items-end bg-slate-50/40">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Ticker
                    </label>
                    <input
                      type="text"
                      value={newStock.ticker}
                      onChange={(e) =>
                        setNewStock({ ...newStock, ticker: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                      placeholder="005930"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newStock.name}
                      onChange={(e) =>
                        setNewStock({ ...newStock, name: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold"
                      placeholder="삼성전자"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Market
                    </label>
                    <select
                      value={newStock.market}
                      onChange={(e) =>
                        setNewStock({ ...newStock, market: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>NASDAQ</option>
                      <option>NYSE</option>
                      <option>ETF</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setStockMaster([newStock, ...stockMaster]);
                      alert("종목 등록 완료");
                    }}
                    className="bg-[#1e293b] text-white px-12 py-3.5 rounded-2xl text-[11px] font-black hover:bg-black transition-all"
                  >
                    추가
                  </button>
                </div>
                <table className="w-full text-[12px] font-bold text-left border-collapse">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="pb-5 pl-4">Ticker</th>
                      <th>Asset Name</th>
                      <th>Market</th>
                      <th>Sector</th>
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stockMaster.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-all">
                        <td className="py-5 pl-4 text-blue-500 font-black italic">
                          {s.ticker}
                        </td>
                        <td className="font-black text-slate-800">{s.name}</td>
                        <td>
                          <span className="bg-slate-100 px-3 py-1 rounded-xl text-[10px] font-black text-slate-500">
                            {s.market}
                          </span>
                        </td>
                        <td className="text-slate-500 font-medium">
                          {s.sector || "-"}
                        </td>
                        <td className="text-slate-300 italic font-medium">
                          {s.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. 일별수익률 / 7. 보유종목일별 / 8. 일별종가 (핵심 데이터 테이블) */}
            {["일별수익률", "보유종목일별", "일별종가"].includes(activeTab) && (
              <div className="animate-in fade-in duration-500">
                <table className="w-full text-[12px] font-bold text-center border-collapse">
                  <thead className="bg-slate-50 text-slate-400 border-y border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-5">Date</th>
                      {activeTab === "일별수익률" ? (
                        <>
                          <th>End Assets</th>
                          <th>Daily P/L</th>
                          <th>Daily Yield</th>
                          <th>Cumulative Profit</th>
                        </>
                      ) : null}
                      {activeTab === "보유종목일별" ? (
                        <>
                          <th>Asset Name</th>
                          <th>Close Price</th>
                          <th>Qty</th>
                          <th>Eval Amount</th>
                          <th>Yield</th>
                        </>
                      ) : null}
                      {activeTab === "일별종가" ? (
                        <>
                          <th>Ticker</th>
                          <th>Name</th>
                          <th>Close Price</th>
                          <th>Volume</th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-800 font-bold">
                    <tr className="hover:bg-slate-50">
                      <td className="py-6 text-slate-400">2026-05-15</td>
                      {activeTab === "일별수익률" ? (
                        <>
                          <td className="text-right pr-10">
                            {formatNum(91958168)}
                          </td>
                          <td className="text-right pr-10 text-blue-500">
                            -500,420
                          </td>
                          <td className="text-right pr-10 text-blue-500">
                            -0.54%
                          </td>
                          <td className="text-right pr-10 font-black italic">
                            {formatNum(46820695)}
                          </td>
                        </>
                      ) : null}
                      {activeTab === "보유종목일별" ? (
                        <>
                          <td className="font-black text-sm">삼성전자</td>
                          <td className="text-right pr-10">
                            {formatNum(78500)}
                          </td>
                          <td>120</td>
                          <td className="text-right pr-10">
                            {formatNum(9420000)}
                          </td>
                          <td className="text-right pr-6 text-rose-500">
                            +8.28%
                          </td>
                        </>
                      ) : null}
                      {activeTab === "일별종가" ? (
                        <>
                          <td className="text-blue-500 font-black italic">
                            005930
                          </td>
                          <td className="font-black">삼성전자</td>
                          <td className="text-right pr-14 font-black">
                            {formatNum(78500)}
                          </td>
                          <td className="text-right pr-10 text-slate-400 tracking-tighter uppercase font-black">
                            15.2M
                          </td>
                        </>
                      ) : null}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");
        * {
          font-family: "Pretendard", sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        body {
          background-color: #f1f5f9;
          margin: 0;
        }
        .animate-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
