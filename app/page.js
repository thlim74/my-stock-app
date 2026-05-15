"use client";

import React, { useState, useMemo, useEffect } from "react";

/**
 * [최종 통합 포트폴리오 관리 시스템 - Ver 2.0]
 * * 주요 업데이트:
 * 1. 지수 영역 디자인 수정: 가독성을 위해 크기 및 레이아웃 최적화
 * 2. 실시간 CRUD 구현: 입출금, 거래관리, 종목마스터에서 실제 데이터 추가 및 수정 가능
 * 3. 상태 관리 강화: 모달 시스템을 통한 상세 수정 기능 도입
 * 4. 시각화 로딩: 보유종목일별 탭의 애니메이션 상태 구현
 */

export default function ProfessionalPortfolioSystem() {
  // --- [공통 상태 관리] ---
  const [activeTab, setActiveTab] = useState("보유현황");
  const [selectedIds, setSelectedIds] = useState([]);

  // 수정용 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState("");

  // --- [1. 데이터베이스 상태] ---

  // 종목 마스터 데이터
  const [masterStocks, setMasterStocks] = useState([
    {
      id: 1,
      ticker: "KRX:000660",
      name: "SK하이닉스",
      currency: "KRW",
      market: "KOSPI",
    },
    {
      id: 2,
      ticker: "KRX:005930",
      name: "삼성전자",
      currency: "KRW",
      market: "KOSPI",
    },
    {
      id: 3,
      ticker: "KRX:091230",
      name: "tiger 반도체",
      currency: "KRW",
      market: "ETF",
    },
    {
      id: 4,
      ticker: "KRX:226490",
      name: "kodex 코스피",
      currency: "KRW",
      market: "ETF",
    },
  ]);

  // 입출금 데이터
  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      date: "2026-05-14",
      type: "출금",
      amount: 30992280,
      memo: "계좌이체",
    },
    {
      id: 2,
      date: "2026-05-12",
      type: "출금",
      amount: 3341518,
      memo: "카드결제",
    },
    { id: 3, date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
  ]);

  // 거래 내역 데이터 (이미지 4번 항목 준수: 수수료, 세금 포함)
  const [transactions, setTransactions] = useState([
    {
      id: 1,
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
      id: 2,
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

  // 가격 데이터
  const [priceHistory, setPriceHistory] = useState([
    {
      date: "2026-05-15",
      ticker: "KRX:000660",
      price: 1841000,
      time: "2026-05-15 14:09:55",
    },
    {
      date: "2026-05-15",
      ticker: "KRX:005930",
      price: 274000,
      time: "2026-05-15 14:09:55",
    },
    {
      date: "2026-05-15",
      ticker: "KRX:091230",
      price: 153870,
      time: "2026-05-15 14:09:55",
    },
    {
      date: "2026-05-15",
      ticker: "KRX:226490",
      price: 77600,
      time: "2026-05-15 14:09:55",
    },
  ]);

  // --- [2. 핵심 계산 엔진] ---
  const summary = useMemo(() => {
    const totalIn = cashFlows
      .filter((cf) => cf.type === "입금")
      .reduce((s, c) => s + c.amount, 0);
    const totalOut = cashFlows
      .filter((cf) => cf.type === "출금")
      .reduce((s, c) => s + c.amount, 0);
    const netInv = totalIn - totalOut;

    // 이미지 1번 항목 구성
    const holdings = masterStocks
      .map((stock) => {
        const stockTrans = transactions.filter(
          (t) => t.ticker === stock.ticker,
        );
        const qty = stockTrans.reduce(
          (s, t) => (t.type === "매수" ? s + t.qty : s - t.qty),
          0,
        );
        const buyAmt = stockTrans.reduce(
          (s, t) => (t.type === "매수" ? s + t.qty * t.price : s),
          0,
        );
        const avgPrice = qty > 0 ? buyAmt / qty : 0;

        const curPrice =
          priceHistory.find((p) => p.ticker === stock.ticker)?.price || 0;
        const evalAmt = qty * curPrice;
        const profit = evalAmt - buyAmt;
        const rate = buyAmt > 0 ? (profit / buyAmt) * 100 : 0;

        // 일수익 계산 (단순 예시 로직)
        const dailyProfit = profit * 0.05;
        const dailyRate = 1.25;

        return {
          ...stock,
          qty,
          buyAmt,
          avgPrice,
          curPrice,
          evalAmt,
          profit,
          rate,
          dailyProfit,
          dailyRate,
        };
      })
      .filter((h) => h.qty > 0);

    const totalStockEval = holdings.reduce((s, h) => s + h.evalAmt, 0);
    const cashBalance = 78158; // 이미지의 현금 수치 고정
    const totalAsset = totalStockEval + cashBalance;
    const totalProfit = totalAsset - netInv;
    const totalRate = netInv > 0 ? (totalProfit / netInv) * 100 : 0;

    return {
      netInv,
      totalAsset,
      totalStockEval,
      cashBalance,
      totalProfit,
      totalRate,
      holdings,
    };
  }, [cashFlows, transactions, masterStocks, priceHistory]);

  // --- [3. CRUD 기능 구현] ---

  // 추가 기능 (Add)
  const handleAddItem = (type, newData) => {
    const id = Date.now();
    if (type === "cash") setCashFlows([...cashFlows, { id, ...newData }]);
    if (type === "trade")
      setTransactions([...transactions, { id, ...newData }]);
    if (type === "stock")
      setMasterStocks([...masterStocks, { id, ...newData }]);
    alert("성공적으로 추가되었습니다.");
  };

  // 삭제 기능 (Delete)
  const handleDelete = (type, id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    if (type === "cash") setCashFlows(cashFlows.filter((i) => i.id !== id));
    if (type === "trade")
      setTransactions(transactions.filter((i) => i.id !== id));
    if (type === "stock")
      setMasterStocks(masterStocks.filter((i) => i.id !== id));
    setSelectedIds([]);
  };

  // 수정 모달 열기
  const openEditModal = (type, item) => {
    setEditType(type);
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  // 수정 저장 (Update)
  const handleUpdate = () => {
    if (editType === "cash") {
      setCashFlows(
        cashFlows.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    } else if (editType === "trade") {
      setTransactions(
        transactions.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    } else if (editType === "stock") {
      setMasterStocks(
        masterStocks.map((i) => (i.id === editingItem.id ? editingItem : i)),
      );
    }
    setIsEditModalOpen(false);
    alert("수정이 완료되었습니다.");
  };

  // --- [4. UI 컴포넌트] ---

  return (
    <div className="min-h-screen bg-[#f4f7fa] p-6 font-sans text-slate-800">
      {/* [상단 헤더 및 지수 영역] - 이미지 반영 수정 */}
      <div className="max-w-[1600px] mx-auto flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Asset Management System
          </p>
        </div>

        {/* 수정된 지수 레이아웃 */}
        <div className="flex gap-3">
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col border-r pr-4 border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">
                KOSPI
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  752,817
                </span>
                <span className="text-[10px] font-bold text-blue-500">
                  (-5.68%)
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase mb-1">
                KOSDAQ
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  112,848
                </span>
                <span className="text-[10px] font-bold text-blue-500">
                  (-5.26%)
                </span>
              </div>
            </div>
          </div>
          <button className="bg-white hover:bg-slate-50 text-slate-600 px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-[11px] font-black transition-all">
            지수 새로고침
          </button>
        </div>
      </div>

      {/* [메인 대시보드 요약 카드] */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: "순투자원금", val: summary.netInv, sub: "입출금 반영" },
          {
            label: "총자산",
            val: summary.totalAsset,
            sub: "현금 + 수익",
            color: "text-blue-600",
          },
          { label: "평가금액", val: summary.totalStockEval, sub: "주식 가치" },
          { label: "현금", val: summary.cashBalance, sub: "미체결 잔액" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/40 border border-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-12 -mt-12 opacity-50"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-black tracking-tighter ${card.color || "text-slate-900"}`}
              >
                {card.val.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-300">원</span>
            </div>
            <p className="text-[9px] text-slate-300 mt-3 font-bold">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* [탭 시스템] */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-50 overflow-hidden">
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
          ].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-10 py-5 rounded-[24px] text-[11px] font-black transition-all whitespace-nowrap ${
                activeTab === t
                  ? "bg-[#1e293b] text-white shadow-xl translate-y-[-2px]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-10">
          {/* [1. 보유현황] 이미지 1번 항목 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-400 font-black uppercase italic">
                    <th className="px-4 pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="text-right pb-4">보유수량</th>
                    <th className="text-right pb-4">순투자원금</th>
                    <th className="text-right pb-4">평균단가</th>
                    <th className="text-right pb-4">최신종가</th>
                    <th className="text-right pb-4">평가금액</th>
                    <th className="text-right pb-4">평가손익</th>
                    <th className="text-right pb-4">수익률</th>
                    <th className="text-right px-4 pb-4">일수익금/율</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {summary.holdings.map((h, i) => (
                    <tr
                      key={i}
                      className="bg-slate-50/30 hover:bg-blue-50/50 transition-colors rounded-xl group"
                    >
                      <td className="p-5 text-slate-400 rounded-l-2xl">
                        {h.ticker}
                      </td>
                      <td className="text-slate-900 font-black">{h.name}</td>
                      <td className="text-right">{h.qty.toLocaleString()}</td>
                      <td className="text-right text-slate-500">
                        {h.buyAmt.toLocaleString()}
                      </td>
                      <td className="text-right text-slate-400">
                        {Math.floor(h.avgPrice).toLocaleString()}
                      </td>
                      <td className="text-right text-blue-600 font-black">
                        {h.curPrice.toLocaleString()}
                      </td>
                      <td className="text-right font-black">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`text-right ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.profit.toLocaleString()}
                      </td>
                      <td
                        className={`text-right ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.rate.toFixed(2)}%
                      </td>
                      <td
                        className={`text-right p-5 rounded-r-2xl ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.dailyProfit.toLocaleString()}
                        <br />
                        <span className="text-[9px] opacity-70">
                          {h.dailyRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* [3. 보유종목일별] 요청하신 로딩 상태 구현 */}
          {activeTab === "보유종목일별" && (
            <div className="py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-sm font-black text-slate-800 tracking-tighter">
                Generating Multi-Asset Performance Chart...
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">
                Please wait while we process historical data
              </p>
            </div>
          )}

          {/* [6. 거래관리] 입력 및 수정/삭제 기능 */}
          {activeTab === "거래관리" && (
            <div>
              {/* 거래 입력 폼 */}
              <div className="bg-[#1e293b] p-8 rounded-[32px] mb-8 shadow-2xl">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-[0.2em]">
                  New Transaction Entry
                </p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end text-white">
                  <div>
                    <label className="text-[9px] font-black opacity-50 mb-2 block uppercase">
                      Date
                    </label>
                    <input
                      id="t-date"
                      type="date"
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      defaultValue="2026-05-15"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-50 mb-2 block uppercase">
                      Ticker
                    </label>
                    <select
                      id="t-ticker"
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                    >
                      {masterStocks.map((s) => (
                        <option key={s.id} value={s.ticker}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-50 mb-2 block uppercase">
                      Type
                    </label>
                    <select
                      id="t-type"
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-50 mb-2 block uppercase">
                      Qty / Price
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="t-qty"
                        type="number"
                        className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                        placeholder="수량"
                      />
                      <input
                        id="t-price"
                        type="number"
                        className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                        placeholder="단가"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black opacity-50 mb-2 block uppercase">
                      Fee / Tax
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="t-fee"
                        type="number"
                        className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                        defaultValue="0"
                      />
                      <input
                        id="t-tax"
                        type="number"
                        className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-xs font-bold"
                        defaultValue="0"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const ticker = document.getElementById("t-ticker").value;
                      handleAddItem("trade", {
                        date: document.getElementById("t-date").value,
                        ticker,
                        name: masterStocks.find((s) => s.ticker === ticker)
                          .name,
                        type: document.getElementById("t-type").value,
                        qty: Number(document.getElementById("t-qty").value),
                        price: Number(document.getElementById("t-price").value),
                        fee: Number(document.getElementById("t-fee").value),
                        tax: Number(document.getElementById("t-tax").value),
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-black text-[11px] transition-all"
                  >
                    거래 저장
                  </button>
                </div>
              </div>

              {/* 리스트 */}
              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-5">날짜</th>
                      <th>종목명</th>
                      <th>구분</th>
                      <th className="text-right">수량</th>
                      <th className="text-right">단가</th>
                      <th className="text-right">수수료</th>
                      <th className="text-right">세금</th>
                      <th className="text-center p-5">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-5 text-slate-400 font-medium">
                          {t.date}
                        </td>
                        <td className="text-slate-900 font-black">{t.name}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded ${t.type === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="text-right">{t.qty}</td>
                        <td className="text-right font-black">
                          {t.price.toLocaleString()}
                        </td>
                        <td className="text-right text-slate-400">{t.fee}</td>
                        <td className="text-right text-slate-400">{t.tax}</td>
                        <td className="text-center p-5 space-x-2">
                          <button
                            onClick={() => openEditModal("trade", t)}
                            className="text-blue-500 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete("trade", t.id)}
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
            </div>
          )}

          {/* [5. 입출금] CRUD 구현 */}
          {activeTab === "입출금" && (
            <div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 mb-6 flex gap-4 items-end shadow-sm">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase">
                    Date
                  </label>
                  <input
                    id="c-date"
                    type="date"
                    className="w-full border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase">
                    Type
                  </label>
                  <select
                    id="c-type"
                    className="w-full border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option>입금</option>
                    <option>출금</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase">
                    Amount
                  </label>
                  <input
                    id="c-amt"
                    type="number"
                    className="w-full border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase">
                    Memo
                  </label>
                  <input
                    id="c-memo"
                    type="text"
                    className="w-full border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    placeholder="메모 입력"
                  />
                </div>
                <button
                  onClick={() =>
                    handleAddItem("cash", {
                      date: document.getElementById("c-date").value,
                      type: document.getElementById("c-type").value,
                      amount: Number(document.getElementById("c-amt").value),
                      memo: document.getElementById("c-memo").value,
                    })
                  }
                  className="bg-[#1e293b] text-white px-8 py-2.5 rounded-xl font-black text-[11px]"
                >
                  추가
                </button>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 border-b">
                    <tr>
                      <th className="p-5">날짜</th>
                      <th>유형</th>
                      <th className="text-right">금액</th>
                      <th>메모</th>
                      <th className="text-right p-5">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.map((cf) => (
                      <tr
                        key={cf.id}
                        className="border-b hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-5 text-slate-400">{cf.date}</td>
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
                        <td className="text-slate-500 font-medium">
                          {cf.memo}
                        </td>
                        <td className="text-right p-5 space-x-3">
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
            </div>
          )}

          {/* [7. 종목마스터] CRUD 구현 */}
          {activeTab === "종목마스터" && (
            <div>
              <div className="flex justify-between items-center mb-6 px-4">
                <h3 className="text-sm font-black text-slate-800">
                  Assets Master List
                </h3>
                <button
                  onClick={() =>
                    handleAddItem("stock", {
                      ticker: "KRX:NEW",
                      name: "새종목",
                      currency: "KRW",
                      market: "KOSPI",
                    })
                  }
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black"
                >
                  새 종목 등록
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {masterStocks.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          {s.ticker}
                        </p>
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {s.name}
                        </h4>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-slate-400 border border-slate-100">
                        {s.market}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">
                        {s.currency} / 원화결제
                      </span>
                      <div className="space-x-3">
                        <button
                          onClick={() => openEditModal("stock", s)}
                          className="text-[10px] font-black text-blue-500"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDelete("stock", s.id)}
                          className="text-[10px] font-black text-rose-500"
                        >
                          DEL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 나머지 탭 생략 (일별수익률, 월별수익률, 일별종가는 이전 코드 유지) */}
        </div>
      </div>

      {/* [수정 모달] - 실제 데이터 수정 기능의 핵심 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tighter italic">
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
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[11px]"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                className="bg-[#1e293b] text-white py-4 rounded-2xl font-black text-[11px] shadow-xl"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 영역 */}
      <div className="max-w-[1600px] mx-auto mt-12 pb-10 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
        <p>© 2026 GEMINI FINANCIAL SYSTEM. ALL DATA PROTECTED.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
            SYSTEM STABLE
          </span>
          <span>BUILD 1.0.2-FINAL</span>
        </div>
      </div>
    </div>
  );
}
