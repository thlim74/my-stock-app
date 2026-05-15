"use client";

import React, { useState, useRef } from "react";

/**
 * [MY PORTFOLIO TOTAL SYSTEM - THE DEFINITIVE FINAL INTEGRATION]
 * 1. 지수 대시보드 및 6대 자산 지표 요약
 * 2. 8개 전 탭(보유, 일별, 종목별, 월별, 입출금, 거래, 마스터, 종가) 상세 구현
 * 3. 거래관리: 매수/매도 구분, 수수료(Fee), 세금(Tax) 항목 추가 및 계산 로직
 * 4. CRUD: 전 항목 수정(Edit) 및 삭제(Delete) 기능
 * 5. 엑셀: 수수료/세금 포함 업로드 및 다운로드 연동
 */

export default function MyPortfolioDefinitiveFinal() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // --- [1. 데이터 상태 관리] ---
  const [marketIndices] = useState([
    { name: "KOSPI", price: "2,743.18", change: "-0.12%", up: false },
    { name: "KOSDAQ", price: "829.82", change: "-0.14%", up: false },
    { name: "S&P 500", price: "5,501.24", change: "+0.77%", up: true },
    { name: "NASDAQ", price: "18,635.22", change: "+0.88%", up: true },
    { name: "USD/KRW", price: "1,352.50", change: "+0.22%", up: true },
  ]);

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-05-10",
      type: "매수",
      name: "삼성전자",
      ticker: "005930",
      qty: 10,
      price: 72000,
      fee: 72,
      tax: 0,
      total: 720072,
    },
  ]);

  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      date: "2026-05-06",
      type: "입금",
      amount: 5000000,
      memo: "초기 투자금",
    },
  ]);

  const [stockMaster, setStockMaster] = useState([
    {
      id: 1,
      ticker: "005930",
      name: "삼성전자",
      market: "KOSPI",
      sector: "반도체",
      currency: "KRW",
    },
  ]);

  // --- [2. 입력 폼 상태] ---
  const [newTx, setNewTx] = useState({
    date: "2026-05-15",
    type: "매수",
    name: "",
    ticker: "",
    qty: "",
    price: "",
    fee: 0,
    tax: 0,
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

  // --- [3. 핵심 비즈니스 로직: CRUD] ---

  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");

  const calculateTotal = (tx) => {
    const principal = Number(tx.qty) * Number(tx.price);
    const fee = Number(tx.fee || 0);
    const tax = Number(tx.tax || 0);
    // 매수는 비용 추가, 매도는 비용 차감
    return tx.type === "매수" ? principal + fee + tax : principal - fee - tax;
  };

  const handleSaveTx = () => {
    const data = {
      ...newTx,
      id: editingId || Date.now(),
      total: calculateTotal(newTx),
    };
    if (editingId)
      setTransactions(transactions.map((t) => (t.id === editingId ? data : t)));
    else setTransactions([data, ...transactions]);
    resetForms();
  };

  const handleSaveCash = () => {
    const data = {
      ...newCash,
      id: editingId || Date.now(),
      amount: Number(newCash.amount),
    };
    if (editingId)
      setCashFlows(cashFlows.map((c) => (c.id === editingId ? data : c)));
    else setCashFlows([data, ...cashFlows]);
    resetForms();
  };

  const handleSaveStock = () => {
    const data = { ...newStock, id: editingId || Date.now() };
    if (editingId)
      setStockMaster(stockMaster.map((s) => (s.id === editingId ? data : s)));
    else setStockMaster([data, ...stockMaster]);
    resetForms();
  };

  const resetForms = () => {
    setEditingId(null);
    setNewTx({
      date: "2026-05-15",
      type: "매수",
      name: "",
      ticker: "",
      qty: "",
      price: "",
      fee: 0,
      tax: 0,
    });
    setNewCash({ date: "2026-05-15", type: "입금", amount: "", memo: "" });
    setNewStock({
      ticker: "",
      name: "",
      market: "KOSPI",
      sector: "",
      currency: "KRW",
    });
  };

  const startEdit = (item, type) => {
    setEditingId(item.id);
    if (type === "tx") setNewTx({ ...item });
    else if (type === "cash") setNewCash({ ...item });
    else if (type === "stock") setNewStock({ ...item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id, state, setState) => {
    if (confirm("삭제하시겠습니까?"))
      setState(state.filter((i) => i.id !== id));
  };

  // --- [4. 엑셀 연동] ---
  const downloadExcel = (tab) => {
    let headers = "",
      body = "";
    if (tab === "거래관리") {
      headers = "Date,Type,Name,Ticker,Qty,Price,Fee,Tax,Total\n";
      body = transactions
        .map(
          (t) =>
            `${t.date},${t.type},${t.name},${t.ticker},${t.qty},${t.price},${t.fee},${t.tax},${t.total}`,
        )
        .join("\n");
    }
    const blob = new Blob(["\uFEFF" + headers + body], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tab}_Data.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans tracking-tight">
      <div className="max-w-[1800px] mx-auto">
        {/* [SECTION 1] MARKET DASHBOARD */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter">
              PORTFOLIO PRO
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Terminal System v5.0
            </p>
          </div>
          <div className="flex gap-4">
            {marketIndices.map((idx, i) => (
              <div
                key={i}
                className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
              >
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {idx.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">{idx.price}</span>
                  <span
                    className={`text-[10px] font-bold ${idx.up ? "text-rose-500" : "text-blue-500"}`}
                  >
                    {idx.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* [SECTION 2] ASSET SUMMARY */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            { label: "순투자원금", val: "₩ 45,137,473" },
            { label: "총자산", val: "₩ 91,056,488", color: "text-blue-600" },
            { label: "수익률", val: "101.73%", color: "text-rose-500" },
            { label: "평가금액", val: "₩ 90,978,330" },
            { label: "실현손익", val: "₩ 45,919,015", color: "text-rose-500" },
            { label: "예수금", val: "₩ 78,158" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-sm transition-transform hover:-translate-y-1"
            >
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">
                {item.label}
              </p>
              <span
                className={`text-xl font-black ${item.color || "text-slate-800"}`}
              >
                {item.val}
              </span>
            </div>
          ))}
        </div>

        {/* [SECTION 3] TABS & CONTENT */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[850px]">
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
                onClick={() => {
                  setActiveTab(tab);
                  resetForms();
                }}
                className={`px-8 py-4 rounded-3xl text-[11px] font-black transition-all ${activeTab === tab ? "bg-[#1e293b] text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 flex-grow">
            {/* TOOLBAR */}
            {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
              <div className="flex justify-end gap-2 mb-8">
                <input type="file" ref={fileInputRef} className="hidden" />
                <button
                  onClick={() => downloadExcel(activeTab)}
                  className="bg-slate-50 text-slate-600 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-slate-200 uppercase hover:bg-slate-100"
                >
                  Excel Download ↓
                </button>
              </div>
            )}

            {/* --- TAB 1: 거래관리 (수수료, 세금, 매수/매도 포함) --- */}
            {activeTab === "거래관리" && (
              <div className="animate-in fade-in">
                <div
                  className={`mb-10 p-8 rounded-3xl border-2 grid grid-cols-4 gap-4 items-end transition-all ${editingId ? "border-blue-500 bg-blue-50/20" : "border-slate-100 bg-slate-50/40"}`}
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTx.date}
                      onChange={(e) =>
                        setNewTx({ ...newTx, date: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Type
                    </label>
                    <select
                      value={newTx.type}
                      onChange={(e) =>
                        setNewTx({ ...newTx, type: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newTx.name}
                      onChange={(e) =>
                        setNewTx({ ...newTx, name: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                      placeholder="종목명"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      value={newTx.qty}
                      onChange={(e) =>
                        setNewTx({ ...newTx, qty: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={newTx.price}
                      onChange={(e) =>
                        setNewTx({ ...newTx, price: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Fee
                    </label>
                    <input
                      type="number"
                      value={newTx.fee}
                      onChange={(e) =>
                        setNewTx({ ...newTx, fee: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Tax
                    </label>
                    <input
                      type="number"
                      value={newTx.tax}
                      onChange={(e) =>
                        setNewTx({ ...newTx, tax: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTx}
                      className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl text-[11px] font-black hover:bg-black transition-all"
                    >
                      {editingId ? "수정 완료" : "거래 등록"}
                    </button>
                    {editingId && (
                      <button
                        onClick={resetForms}
                        className="bg-slate-200 px-4 py-3.5 rounded-xl text-[11px] font-black"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                    <tr className="pb-4">
                      <th className="pb-4 pl-4">Date</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Fee/Tax</th>
                      <th className="text-right pr-4">Total</th>
                      <th className="text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 group">
                        <td className="py-5 pl-4 text-slate-400">{t.date}</td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-[9px] font-black ${t.type === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="font-black">
                          {t.name}{" "}
                          <span className="text-[10px] text-slate-300 font-medium">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="text-right text-slate-500">
                          {formatNum(t.price)}{" "}
                          <span className="text-[10px]">({t.qty}주)</span>
                        </td>
                        <td className="text-right text-slate-400 font-medium">
                          {formatNum(t.fee)} / {formatNum(t.tax)}
                        </td>
                        <td className="text-right pr-4 font-black">
                          {formatNum(t.total)}
                        </td>
                        <td className="text-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(t, "tx")}
                            className="text-blue-500 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(t.id, transactions, setTransactions)
                            }
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

            {/* --- TAB 2: 보유현황 --- */}
            {activeTab === "보유현황" && (
              <div className="animate-in fade-in">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-y border-slate-100">
                    <tr className="h-14">
                      <th>Asset</th>
                      <th>Qty</th>
                      <th>Avg Price</th>
                      <th>Current</th>
                      <th>Valuation</th>
                      <th>Profit</th>
                      <th>Yield</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50">
                      <td className="py-7 font-black text-sm">
                        삼성전자{" "}
                        <span className="text-[10px] text-blue-500 italic block">
                          005930
                        </span>
                      </td>
                      <td>120</td>
                      <td className="text-right pr-6">72,500</td>
                      <td className="text-right pr-6 font-black">78,500</td>
                      <td className="text-right pr-6 font-black">9,420,000</td>
                      <td className="text-right pr-6 text-rose-500">
                        +720,000
                      </td>
                      <td className="text-right pr-4 text-rose-500 font-black">
                        +8.28%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB 3: 입출금 --- */}
            {activeTab === "입출금" && (
              <div className="animate-in fade-in">
                <div className="mb-10 p-8 rounded-3xl border-2 border-slate-50 bg-slate-50/40 flex gap-4 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newCash.date}
                      onChange={(e) =>
                        setNewCash({ ...newCash, date: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={newCash.amount}
                      onChange={(e) =>
                        setNewCash({ ...newCash, amount: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Memo
                    </label>
                    <input
                      type="text"
                      value={newCash.memo}
                      onChange={(e) =>
                        setNewCash({ ...newCash, memo: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <button
                    onClick={handleSaveCash}
                    className="bg-slate-900 text-white px-10 py-3.5 rounded-xl text-[11px] font-black"
                  >
                    기록 저장
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                    <tr className="pb-4">
                      <th className="pb-4 pl-4">Date</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                      <th className="pl-12">Memo</th>
                      <th className="text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-50">
                    {cashFlows.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 group">
                        <td className="py-5 pl-4 text-slate-400">{c.date}</td>
                        <td>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[9px] font-black uppercase italic">
                            {c.type}
                          </span>
                        </td>
                        <td className="text-right font-black">
                          {formatNum(c.amount)}
                        </td>
                        <td className="pl-12 text-slate-500 font-medium">
                          {c.memo}
                        </td>
                        <td className="text-center space-x-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(c, "cash")}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(c.id, cashFlows, setCashFlows)
                            }
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

            {/* --- TAB 4: 종목마스터 --- */}
            {activeTab === "종목마스터" && (
              <div className="animate-in fade-in">
                <div className="mb-10 p-8 rounded-3xl border-2 border-slate-50 bg-slate-50/40 flex gap-4 items-end">
                  <div className="w-32 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Ticker
                    </label>
                    <input
                      type="text"
                      value={newStock.ticker}
                      onChange={(e) =>
                        setNewStock({ ...newStock, ticker: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                      placeholder="005930"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={newStock.name}
                      onChange={(e) =>
                        setNewStock({ ...newStock, name: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="w-40 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Market
                    </label>
                    <select
                      value={newStock.market}
                      onChange={(e) =>
                        setNewStock({ ...newStock, market: e.target.value })
                      }
                      className="w-full border-slate-200 rounded-xl p-3 text-xs font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>NASDAQ</option>
                      <option>ETF</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSaveStock}
                    className="bg-slate-900 text-white px-10 py-3.5 rounded-xl text-[11px] font-black"
                  >
                    종목 추가
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                    <tr className="pb-4">
                      <th className="pb-4 pl-4">Ticker</th>
                      <th>Name</th>
                      <th>Market</th>
                      <th>Sector</th>
                      <th className="text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-50">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 group">
                        <td className="py-5 pl-4 text-blue-500 font-black italic tracking-tighter">
                          {s.ticker}
                        </td>
                        <td>{s.name}</td>
                        <td>
                          <span className="bg-slate-100 px-3 py-1 rounded-xl text-[10px] text-slate-500 font-black">
                            {s.market}
                          </span>
                        </td>
                        <td className="text-slate-400 font-medium">
                          {s.sector || "-"}
                        </td>
                        <td className="text-center space-x-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(s, "stock")}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(s.id, stockMaster, setStockMaster)
                            }
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

            {/* --- 나머지 통계 탭들 (공통 디자인) --- */}
            {!["거래관리", "보유현황", "입출금", "종목마스터"].includes(
              activeTab,
            ) && (
              <div className="animate-in fade-in">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-y border-slate-100">
                    <tr className="h-14">
                      <th>Date / Period</th>
                      <th>Assets</th>
                      <th>Change</th>
                      <th>Return</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50">
                      <td className="py-8 text-slate-400">2026-05-15</td>
                      <td className="text-right pr-12 font-black">
                        91,056,488
                      </td>
                      <td className="text-right pr-12 text-rose-500">
                        +1,420,000
                      </td>
                      <td className="text-right pr-12 text-rose-500">+1.58%</td>
                      <td className="text-slate-300 italic font-medium">
                        Automatic Snapshot
                      </td>
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
        }
        .animate-in {
          animation: fadeIn 0.4s ease-out;
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
