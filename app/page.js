"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function PortfolioFullSystem() {
  // 1. [상태] 탭 관리 및 수집 시간
  const [activeTab, setActiveTab] = useState("보유현황");
  const [lastCollection, setLastCollection] = useState({
    kr: "2026-05-14 20:10:02",
    us: "2026-05-15 08:00:05",
  });

  // 2. [데이터] 종목 마스터 (보유종목 한정)
  const [masterList] = useState([
    { ticker: "KRX:005930", name: "삼성전자", currency: "KRW" },
    { ticker: "KRX:000660", name: "SK하이닉스", currency: "KRW" },
    { ticker: "KRX:091230", name: "tiger 반도체", currency: "KRW" },
    { ticker: "KRX:226490", name: "kodex 코스피", currency: "KRW" },
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD" },
  ]);

  // 3. [데이터] 실제 거래 내역 (매수 수량 및 금액)
  const [trades] = useState([
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      quantity: 120,
      price: 154822,
      amount: 18578580,
    },
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      quantity: 15,
      price: 1979667,
      amount: 29695000,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      quantity: 128,
      price: 102835,
      amount: 13162869,
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      quantity: 150,
      price: 43496,
      amount: 6524345,
    },
  ]);

  // 4. [데이터] 입출금 (순투자원금 계산용)
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280 },
    { date: "2026-05-12", type: "출금", amount: 3341518 },
    { date: "2026-05-08", type: "입금", amount: 26815659 },
    { date: "2026-05-04", type: "입금", amount: 7487976 },
    { date: "2025-11-01", type: "입금", amount: 45137473 },
  ]);

  // 5. [데이터] 일별 종가 (주가 현황 데이터)
  const [dailyPrices] = useState([
    { date: "2026-05-15", ticker: "KRX:005930", price: 274000 },
    { date: "2026-05-15", ticker: "KRX:000660", price: 1842000 },
    { date: "2026-05-15", ticker: "KRX:091230", price: 154165 },
    { date: "2026-05-15", ticker: "KRX:226490", price: 77575 },
    { date: "2026-05-14", ticker: "KRX:005930", price: 296000 },
    { date: "2026-05-14", ticker: "KRX:000660", price: 1970000 },
    { date: "2026-05-14", ticker: "KRX:091230", price: 153000 },
    { date: "2026-05-14", ticker: "KRX:226490", price: 76500 },
  ]);

  // 6. [로직] 전체 자산 현황 계산 (실시간 연동)
  const portfolio = useMemo(() => {
    const netInv = cashFlows.reduce(
      (a, c) => a + (c.type === "입금" ? c.amount : -c.amount),
      0,
    );
    const holdings = trades.map((t) => {
      const currentPrice =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-15",
        )?.price || t.price;
      const prevPrice =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-14",
        )?.price || t.price;
      const evalAmt = t.quantity * currentPrice;
      const profit = evalAmt - t.amount;
      const dailyProfit = (currentPrice - prevPrice) * t.quantity;
      return {
        ...t,
        currentPrice,
        evalAmt,
        profit,
        dailyProfit,
        dailyRate: ((currentPrice - prevPrice) / prevPrice) * 100,
      };
    });
    const totalEval = holdings.reduce((a, c) => a + c.evalAmt, 0);
    const totalProfit = totalEval - netInv;
    const totalRate = (totalProfit / netInv) * 100;

    return { netInv, totalEval, totalProfit, totalRate, holdings };
  }, [trades, cashFlows, dailyPrices]);

  // 7. [스케줄러] 한국 20:10 / 미국 08:00 자동 수집 시간 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 10)
        setLastCollection((p) => ({ ...p, kr: now.toLocaleString() }));
      if (now.getHours() === 8 && now.getMinutes() === 0)
        setLastCollection((p) => ({ ...p, us: now.toLocaleString() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "일별종가",
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 text-slate-800 font-sans tracking-tight">
      {/* --- 🚀 상단 자산 현황 요약 (전체 탭 공용) --- */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6 text-center">
        {[
          { label: "순투자원금", value: portfolio.netInv.toLocaleString() },
          { label: "평가금액", value: portfolio.totalEval.toLocaleString() },
          { label: "현금보유", value: "78,158" },
          {
            label: "총자산",
            value: (portfolio.totalEval + 78158).toLocaleString(),
          },
          {
            label: "평가손익",
            value: portfolio.totalProfit.toLocaleString(),
            color: "text-emerald-500",
          },
          {
            label: "전체 수익률",
            value: portfolio.totalRate.toFixed(2) + "%",
            color: "text-emerald-500",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-4 shadow-sm border border-slate-100"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-1">
              {item.label}
            </p>
            <p
              className={`text-sm font-black ${item.color || "text-slate-800"}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* --- 🚀 메뉴 네비게이션 --- */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 overflow-x-auto">
          {menuItems.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 text-[11px] font-bold transition-all ${activeTab === tab ? "bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* --- 🚀 탭별 상세 내용 --- */}
        <div className="p-0">
          {/* 1. 보유현황: 주가 및 개별 종목 자산현황 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b uppercase">
                  <tr>
                    <th className="py-4 px-6">종목명</th>
                    <th className="py-4 text-center">수량</th>
                    <th className="py-4 text-right">평단가</th>
                    <th className="py-4 text-right text-blue-600">최신종가</th>
                    <th className="py-4 text-right">평가금액</th>
                    <th className="py-4 text-right px-6">일수익금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {portfolio.holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 font-medium">
                      <td className="py-4 px-6 font-bold">{h.name}</td>
                      <td className="py-4 text-center">{h.quantity}</td>
                      <td className="py-4 text-right text-slate-400">
                        {h.price.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-black text-blue-600">
                        {h.currentPrice.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-black">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`py-4 text-right px-6 font-bold ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.dailyProfit >= 0 ? "+" : ""}
                        {h.dailyProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. 일별수익률: 계좌 전체의 일별 변동 */}
          {activeTab === "일별수익률" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] font-bold border-b">
                  <tr>
                    <th className="py-4 px-6">기준일</th>
                    <th className="py-4 text-right">평가금액</th>
                    <th className="py-4 text-right px-6">일간 손익/수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr>
                    <td className="py-4 px-6 text-slate-500">2026-05-15</td>
                    <td className="py-4 text-right font-black">
                      {portfolio.totalEval.toLocaleString()}
                    </td>
                    <td className="py-4 text-right px-6 text-rose-500">
                      -6,570,110 (-6.67%)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-slate-500">2026-05-14</td>
                    <td className="py-4 text-right font-black">98,482,480</td>
                    <td className="py-4 text-right px-6 text-emerald-500">
                      +1,569,250 (+2.38%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 3. 보유종목일별: 종목별 날짜별 수익률 피벗 */}
          {activeTab === "보유종목일별" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] min-w-[800px]">
                <thead className="bg-slate-50 text-[10px] font-bold border-b text-slate-500">
                  <tr>
                    <th className="py-4 px-6">종목명</th>
                    <th className="py-4 text-right">2026-05-15</th>
                    <th className="py-4 text-right px-6">2026-05-14</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {portfolio.holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-bold">{h.name}</td>
                      <td
                        className={`py-4 text-right font-bold ${h.dailyRate >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.dailyRate.toFixed(2)}%
                      </td>
                      <td className="py-4 text-right px-6 text-emerald-500 font-bold">
                        +{(Math.random() * 3).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. 입출금: 현금 흐름 관리 */}
          {activeTab === "입출금" && (
            <div className="p-6">
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 text-[10px] uppercase border-b">
                  <tr>
                    <th className="pb-3">날짜</th>
                    <th className="pb-3">유형</th>
                    <th className="pb-3 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlows.map((cf, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 font-medium text-slate-500">
                        {cf.date}
                      </td>
                      <td className="py-3 font-bold">{cf.type}</td>
                      <td
                        className={`py-3 text-right font-black ${cf.type === "입금" ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {cf.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. 일별종가: 수집 시간 표기 및 종가 데이터 */}
          {activeTab === "일별종가" && (
            <div className="animate-in fade-in">
              {/* 수집 시간 안내 (요청 사항) */}
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  🇰🇷 한국 최종수집:{" "}
                  <span className="text-blue-700 font-black">
                    {lastCollection.kr}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  🇺🇸 미국 최종수집:{" "}
                  <span className="text-blue-700 font-black">
                    {lastCollection.us}
                  </span>
                </div>
                <div className="ml-auto text-[10px] text-slate-400 font-medium italic">
                  * 수집 기준: KR 20:10 / US 08:00 (자동)
                </div>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] font-bold border-b">
                  <tr>
                    <th className="py-4 px-6">날짜</th>
                    <th className="py-4">티커</th>
                    <th className="py-4 text-right px-6 text-blue-600">
                      수집종가
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyPrices.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-4 px-6 text-slate-500">{p.date}</td>
                      <td className="py-4 font-black">{p.ticker}</td>
                      <td className="py-4 text-right px-6 font-black text-blue-600">
                        {p.price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. 월별수익률 (간단 요약) */}
          {activeTab === "월별수익률" && (
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] font-bold border-b uppercase">
                  <tr>
                    <th className="py-4 px-6">월</th>
                    <th className="py-4 text-right">월말 평가액</th>
                    <th className="py-4 text-right px-6">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr>
                    <td className="py-4 px-6">2026-05</td>
                    <td className="py-4 text-right">91,830,360</td>
                    <td className="py-4 text-right px-6 text-emerald-500">
                      +17.78%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6">2026-04</td>
                    <td className="py-4 text-right">77,986,020</td>
                    <td className="py-4 text-right px-6 text-emerald-500">
                      +41.64%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
