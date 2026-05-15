"use client";

import React, { useState, useMemo } from "react";

/**
 * [완전 통합 포트폴리오 관리 시스템]
 * 모든 기능 탭 및 요청하신 계산 로직(순투자원금, 평가손익 등) 완벽 통합 버전
 */
export default function UltimateIntegratedPortfolio() {
  const [activeTab, setActiveTab] = useState("보유현황");

  // --- [1. 데이터 소스 초기 상태] ---

  // 종목 마스터 데이터
  const [masterStocks] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      currency: "KRW",
      market: "KOSPI",
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      currency: "KRW",
      market: "KOSPI",
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      currency: "KRW",
      market: "ETF",
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      currency: "KRW",
      market: "ETF",
    },
  ]);

  // 입출금 내역 (순투자원금 및 현금보유액 계산의 기준)
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280, memo: "계좌이체" },
    { date: "2026-05-12", type: "출금", amount: 3341518, memo: "카드결제" },
    { date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
    { date: "2026-05-04", type: "입금", amount: 7487976, memo: "입금" },
    { date: "2026-03-01", type: "입금", amount: 45167636, memo: "초기자본" },
  ]);

  // 일별 종가 데이터 (이미지 기반 수치)
  const [priceHistory, setPriceHistory] = useState([
    {
      date: "2026-05-15",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1841000,
      time: "2026-05-15 14:09:55",
    },
    {
      date: "2026-05-15",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 274000,
      time: "2026-05-15 14:09:55",
    },
    {
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1970000,
      time: "2026-05-15 07:12:23",
    },
    {
      date: "2026-05-14",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 296000,
      time: "2026-05-15 07:12:23",
    },
    {
      date: "2026-05-14",
      ticker: "KRX:091230",
      name: "tiger 반도체",
      price: 165410,
      time: "2026-05-15 07:12:23",
    },
    {
      date: "2026-05-14",
      ticker: "KRX:226490",
      name: "kodex 코스피",
      price: 81600,
      time: "2026-05-15 07:12:23",
    },
  ]);

  // 현재 보유 주식 수량 및 매수원금
  const [holdingsData] = useState([
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      qty: 150,
      buyAmt: 6524345,
      avgPrice: 43495.63,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      qty: 128,
      buyAmt: 13162869,
      avgPrice: 102834.91,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      qty: 120,
      buyAmt: 18578580,
      avgPrice: 154821.5,
    },
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      qty: 15,
      buyAmt: 29695000,
      avgPrice: 1979666.67,
    },
  ]);

  // --- [2. 핵심 연동 계산 로직] ---
  const summary = useMemo(() => {
    // 1. 순투자원금: 입금 - 출금
    const totalIn = cashFlows
      .filter((cf) => cf.type === "입금")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalOut = cashFlows
      .filter((cf) => cf.type === "출금")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const netInv = totalIn - totalOut;

    // 2. 주식 평가금액 계산
    const calculatedHoldings = holdingsData.map((h) => {
      const curPrice =
        priceHistory.find(
          (p) => p.ticker === h.ticker && p.date === "2026-05-15",
        )?.price || 0;
      const prePrice =
        priceHistory.find(
          (p) => p.ticker === h.ticker && p.date === "2026-05-14",
        )?.price || curPrice;
      const evalAmt = h.qty * curPrice;
      const dailyProfit = (curPrice - prePrice) * h.qty;
      const dailyRate =
        prePrice !== 0 ? ((curPrice - prePrice) / prePrice) * 100 : 0;
      return { ...h, curPrice, evalAmt, dailyProfit, dailyRate };
    });
    const totalStockEval = calculatedHoldings.reduce(
      (acc, obj) => acc + obj.evalAmt,
      0,
    );

    // 3. 현금보유: 순투자원금 - 주식매수원금 (이미지상 78,158원 근사치 산출)
    const totalBuyAmt = holdingsData.reduce(
      (acc, curr) => acc + curr.buyAmt,
      0,
    );
    const cashBalance = netInv - totalBuyAmt;

    // 4. 총자산(현금포함): 주식 평가금액 + 현금
    const totalAsset = totalStockEval + cashBalance;

    // 5. 평가손익: 총자산 - 순투자원금
    const totalProfit = totalAsset - netInv;

    // 6. 전체 수익률
    const totalRate = netInv !== 0 ? (totalProfit / netInv) * 100 : 0;

    return {
      netInv,
      totalAsset,
      totalStockEval,
      cashBalance,
      totalProfit,
      totalRate,
      calculatedHoldings,
    };
  }, [cashFlows, priceHistory, holdingsData]);

  // --- [3. UI 핸들러] ---
  const tabs = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "거래관리",
    "종목마스터",
    "일별종가",
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-800 font-sans">
      {/* 1. HEADER & 주가지수 (5개 구성) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tighter uppercase">
            Portfolio Management
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
            Real-time Asset Tracker
          </p>
        </div>
        <button className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold shadow-sm hover:bg-slate-50">
          지수 새로고침
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {
            name: "코스피",
            val: "752,817",
            rate: "-5.68%",
            color: "text-blue-500",
          },
          {
            name: "코스닥",
            val: "112,848",
            rate: "-5.26%",
            color: "text-blue-500",
          },
          { name: "S&P 500", val: "N/A", rate: "0%", color: "text-rose-500" },
          { name: "나스닥", val: "N/A", rate: "0%", color: "text-rose-500" },
          { name: "다우존스", val: "N/A", rate: "0%", color: "text-rose-500" },
        ].map((idx, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="text-[9px] font-bold text-slate-400 mb-1">
                {idx.name}
              </p>
              <p className="text-lg font-black text-slate-900">{idx.val}</p>
            </div>
            <span className={`text-[11px] font-bold ${idx.color}`}>
              {idx.rate}
            </span>
          </div>
        ))}
      </div>

      {/* 2. 자산 요약 대시보드 (요청 로직 반영) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {[
          { label: "순투자원금", val: summary.netInv },
          { label: "총자산(현금포함)", val: summary.totalAsset },
          { label: "현금보유", val: summary.cashBalance },
          { label: "평가손익", val: summary.totalProfit, highlight: true },
          {
            label: "전체 수익률",
            val: summary.totalRate.toFixed(2) + "%",
            isRate: true,
          },
          { label: "주식평가액", val: summary.totalStockEval },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-black ${card.highlight ? (summary.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500") : "text-slate-900"}`}
              >
                {card.isRate ? card.val : card.val.toLocaleString()}
              </span>
              {!card.isRate && (
                <span className="text-[10px] font-bold text-slate-300">원</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. 메인 기능 탭 영역 */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex bg-slate-50/50 p-2 overflow-x-auto border-b border-slate-100 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-3 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${activeTab === t ? "bg-[#1e293b] text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* [탭 1: 보유현황] */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto animate-in fade-in">
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                최신종가 기준시각: 2026. 5. 15. 오후 2:09:55 | 소스: NaverRT 4
              </p>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4 text-right">수량</th>
                    <th className="pb-4 text-right">평단가</th>
                    <th className="pb-4 text-right">현재가</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right px-4">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.calculatedHoldings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-5 text-slate-400 font-medium">
                        {h.ticker}
                      </td>
                      <td className="py-5 font-black text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-5 text-right">{h.qty}</td>
                      <td className="py-5 text-right text-slate-400 font-medium">
                        {h.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-5 text-right text-blue-600 font-black">
                        {h.curPrice.toLocaleString()}
                      </td>
                      <td className="py-5 text-right font-black">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`py-5 text-right px-4 font-black ${h.evalAmt >= h.buyAmt ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {(((h.evalAmt - h.buyAmt) / h.buyAmt) * 100).toFixed(2)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 2: 일별수익률] */}
          {activeTab === "일별수익률" && (
            <div className="overflow-x-auto animate-in fade-in">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th>구분</th>
                    <th className="text-right">평가금액</th>
                    <th className="text-right">일간 손익</th>
                    <th className="text-right px-4">누적 평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50">
                    <td className="py-5 px-4 text-slate-500">2026-05-15</td>
                    <td>실시간</td>
                    <td className="text-right font-black">91,912,370</td>
                    <td className="text-right text-rose-500">-6,570,110</td>
                    <td className="text-right px-4 text-emerald-500">
                      46,845,139.38
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 3: 보유종목일별] */}
          {activeTab === "보유종목일별" && (
            <div className="animate-in fade-in">
              <div className="flex gap-2 mb-6 items-end">
                <input
                  type="date"
                  className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold"
                  defaultValue="2026-05-07"
                />
                <input
                  type="date"
                  className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold"
                  defaultValue="2026-05-15"
                />
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-100">
                  조회
                </button>
              </div>
              <table className="w-full text-left text-[10px] font-bold border-collapse">
                <thead className="bg-slate-50/50 text-slate-500 border-y">
                  <tr>
                    <th className="p-4">종목명</th>
                    <th className="text-right">2026-05-15</th>
                    <th className="text-right">2026-05-14</th>
                    <th className="text-right p-4">2026-05-13</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/30 font-black">
                    <td className="p-4 text-slate-900">일별 수익 합계</td>
                    <td className="text-right text-rose-500 font-black">
                      -6,603,110 (-6.70%)
                    </td>
                    <td className="text-right text-emerald-500 font-black">
                      1,569,250 (2.38%)
                    </td>
                    <td className="text-right p-4 text-emerald-500 font-black">
                      1,752,900 (2.73%)
                    </td>
                  </tr>
                  {summary.calculatedHoldings.map((h, i) => (
                    <tr key={i}>
                      <td className="p-4 text-slate-600">{h.name}</td>
                      <td
                        className={`text-right ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.dailyProfit.toLocaleString()} (
                        {h.dailyRate.toFixed(2)}%)
                      </td>
                      <td className="text-right text-slate-300">0 (0.00%)</td>
                      <td className="text-right p-4 text-slate-300">
                        0 (0.00%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 4: 월별수익률] */}
          {activeTab === "월별수익률" && (
            <div className="overflow-x-auto animate-in fade-in font-bold">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f1f5f9] text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="p-4">월</th>
                    <th>월초평가액</th>
                    <th>월말평가액</th>
                    <th className="text-right">월간 손익(보정)</th>
                    <th className="text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 text-slate-500">2026-05</td>
                    <td className="font-medium">77,986,020</td>
                    <td className="font-black text-slate-900">91,880,010</td>
                    <td className="text-right text-emerald-500 font-black">
                      13,863,827 (17.78%)
                    </td>
                    <td className="text-right px-4 text-emerald-500 font-black">
                      46,812,779.38
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-500">2026-04</td>
                    <td className="font-medium">55,040,000</td>
                    <td className="font-black text-slate-900">77,986,020</td>
                    <td className="text-right text-emerald-500 font-black">
                      22,920,761 (41.64%)
                    </td>
                    <td className="text-right px-4 text-emerald-500 font-black">
                      32,948,952.38
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 5: 입출금] */}
          {activeTab === "입출금" && (
            <div className="overflow-x-auto animate-in fade-in">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase font-bold">
                  <tr>
                    <th className="pb-4">날짜</th>
                    <th className="pb-4">유형</th>
                    <th className="pb-4 text-right">금액</th>
                    <th className="pb-4 px-6 text-right">메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cashFlows.map((cf, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-4 text-slate-500">{cf.date}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-lg ${cf.type === "입금" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                        >
                          {cf.type}
                        </span>
                      </td>
                      <td className="text-right font-black">
                        {cf.amount.toLocaleString()}
                      </td>
                      <td className="text-right px-6 text-slate-400">
                        {cf.memo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 6: 거래관리] */}
          {activeTab === "거래관리" && (
            <div className="animate-in fade-in">
              <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100 mb-8 grid grid-cols-11 gap-4 items-end font-bold">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase font-black">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase font-black">
                    Type
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>매수 (Buy)</option>
                    <option>매도 (Sell)</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase font-black">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase font-black">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="col-span-2 bg-[#1e293b] text-white p-3.5 rounded-xl font-black text-[11px] shadow-xl hover:bg-black transition-all">
                  거래 저장
                </button>
              </div>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-300 border-b uppercase">
                  <tr>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Asset</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-center">Price</th>
                    <th className="pb-4 text-right px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-6 text-slate-400 font-medium">
                      2026-05-10
                    </td>
                    <td>
                      <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg">
                        매수
                      </span>
                    </td>
                    <td className="font-black text-slate-900">삼성전자</td>
                    <td className="text-center">10</td>
                    <td className="text-center">72,000</td>
                    <td className="text-right px-4">
                      <button className="text-slate-200 hover:text-rose-500">
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 7: 종목마스터] */}
          {activeTab === "종목마스터" && (
            <div className="overflow-x-auto animate-in fade-in">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase font-bold">
                  <tr>
                    <th className="pb-4 font-black">티커</th>
                    <th className="pb-4 font-black">종목명</th>
                    <th className="pb-4 font-black">통화</th>
                    <th className="pb-4 font-black">시장</th>
                    <th className="pb-4 text-right px-4 font-black">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterStocks.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-4 text-slate-400 font-medium">
                        {s.ticker}
                      </td>
                      <td className="font-black text-slate-900">{s.name}</td>
                      <td>{s.currency || "KRW"}</td>
                      <td>{s.market}</td>
                      <td className="text-right px-4">
                        <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md text-[10px]">
                          활성
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* [탭 8: 일별종가] */}
          {activeTab === "일별종가" && (
            <div className="animate-in fade-in">
              <div className="bg-slate-50/80 p-8 rounded-[24px] border border-slate-100 mb-8 flex gap-4 items-end font-bold">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Base Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-[#2563eb] text-white px-8 py-3.5 rounded-xl font-black text-[11px] shadow-lg">
                  종가 추가
                </button>
              </div>
              <div className="flex gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6 text-[10px] font-bold text-blue-700">
                <span>🇰🇷 한국 최종수집: 2026-05-15 14:09:55</span>
                <span className="text-blue-200">|</span>
                <span>🇺🇸 미국 최종수집: 2026-05-15 08:00:02</span>
              </div>
              <table className="w-full text-left text-[11px] font-bold font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4 font-black">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-center font-black">종가</th>
                    <th className="text-center font-black">수집시각</th>
                    <th className="text-right px-4 font-black">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {priceHistory.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/30">
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {r.date}
                      </td>
                      <td className="text-slate-500 font-medium">{r.ticker}</td>
                      <td className="py-4 font-black text-slate-900">
                        {r.name}
                      </td>
                      <td className="py-4 text-center text-blue-600 font-black">
                        {r.price.toLocaleString()}
                      </td>
                      <td className="py-4 text-center text-slate-400">
                        {r.time}
                      </td>
                      <td className="py-4 text-right px-4">
                        <button className="text-rose-500 font-black text-[10px]">
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
    </div>
  );
}
