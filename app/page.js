"use client";

import React, { useState, useMemo } from "react";

export default function MyPortfolioFullApp() {
  // 1. [상태] 현재 활성화된 탭 관리
  const [activeTab, setActiveTab] = useState("보유현황");

  // 2. [데이터] 초기 마스터 정보 및 거래 내역 (이미지 기반 수치 반영)
  const [cashBalance] = useState(78158); // 현금 78,158원
  const [lastCollection] = useState({
    kr: "2026-05-15 14:09:55",
    us: "2026-05-15 08:00:00",
  });

  // 거래 내역 (보유수량 및 평단가 계산용)
  const [trades] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      qty: 15,
      avgPrice: 1979667,
      totalBuy: 29695000,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      qty: 120,
      avgPrice: 154822,
      totalBuy: 18578580,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      qty: 128,
      avgPrice: 102835,
      totalBuy: 13162869,
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      qty: 150,
      avgPrice: 43496,
      totalBuy: 6524345,
    },
  ]);

  // 일별 종가 (보유현황 및 일별수익률 계산용)
  const [dailyPrices] = useState([
    { date: "2026-05-15", ticker: "KRX:000660", price: 1841000 },
    { date: "2026-05-15", ticker: "KRX:005930", price: 274000 },
    { date: "2026-05-15", ticker: "KRX:091230", price: 153870 },
    { date: "2026-05-15", ticker: "KRX:226490", price: 77600 },
    { date: "2026-05-14", ticker: "KRX:000660", price: 1970000 },
    { date: "2026-05-14", ticker: "KRX:005930", price: 296000 },
  ]);

  // 3. [계산 로직] 상단 대시보드 및 각 탭 연동 데이터
  const portfolio = useMemo(() => {
    const netInv = 45137473; // 이미지상 순투자원금
    const holdings = trades.map((t) => {
      const cur =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-15",
        )?.price || 0;
      const prev =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-14",
        )?.price || cur;
      const evalAmt = t.qty * cur;
      return {
        ...t,
        cur,
        evalAmt,
        profit: evalAmt - t.totalBuy,
        rate: ((evalAmt - t.totalBuy) / t.totalBuy) * 100,
        dailyProfit: (cur - prev) * t.qty,
        dailyRate: ((cur - prev) / prev) * 100,
      };
    });
    const totalEval = holdings.reduce((a, c) => a + c.evalAmt, 0);
    return { netInv, totalEval, totalAsset: totalEval + cashBalance, holdings };
  }, [trades, dailyPrices, cashBalance]);

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
    <div className="min-h-screen bg-[#f8fafc] p-6 text-[#1e293b] font-sans">
      {/* --- 🚀 상단 타이틀 및 지수 보드 --- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-[#0f172a]">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Asset Management System
          </p>
        </div>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm hover:bg-slate-50 transition-all">
          지수 새로고침
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "코스피", value: "752,817", change: "-5.68%" },
          { label: "코스닥", value: "112,848", change: "-5.26%" },
          { label: "S&P 500", value: "N/A", change: "0%" },
          { label: "나스닥", value: "N/A", change: "0%" },
          { label: "다우존스", value: "N/A", change: "0%" },
        ].map((index, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
          >
            <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">
              {index.label}
            </p>
            <div className="flex justify-between items-end">
              <span className="text-lg font-black text-[#0f172a]">
                {index.value}
              </span>
              <span className="text-[10px] font-bold text-blue-500 mb-1">
                {index.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- 🚀 핵심 요약 대시보드 --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "순투자원금",
            value: portfolio.netInv.toLocaleString() + " 원",
          },
          {
            label: "총자산",
            value: portfolio.totalAsset.toLocaleString() + " 원",
          },
          {
            label: "평가금액",
            value: portfolio.totalEval.toLocaleString() + " 원",
          },
          { label: "현금", value: cashBalance.toLocaleString() + " 원" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32"
          >
            <p className="text-[11px] font-bold text-slate-400">{card.label}</p>
            <p className="text-xl font-black text-[#0f172a]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* --- 🚀 네비게이션 및 탭 컨텐츠 --- */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex bg-[#f8fafc] p-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-[11px] font-black transition-all rounded-2xl ${activeTab === tab ? "bg-[#1e293b] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* 1. 보유현황 탭 */}
          {activeTab === "보유현황" && (
            <div>
              <p className="text-[11px] text-slate-400 font-bold mb-6">
                최신종가 기준시각: {lastCollection.kr} | 소스: NaverRT 4 / Sheet
                0
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase">
                      <th className="pb-4">티커</th>
                      <th className="pb-4">종목명</th>
                      <th className="pb-4 text-right">보유수량</th>
                      <th className="pb-4 text-right">순투자원금</th>
                      <th className="pb-4 text-right">최신종가</th>
                      <th className="pb-4 text-right">수익률</th>
                      <th className="pb-4 text-right">일수익금</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {portfolio.holdings.map((h, i) => (
                      <tr key={i} className="group">
                        <td className="py-5 font-bold text-slate-500">
                          {h.ticker}
                        </td>
                        <td className="py-5 font-black text-[#0f172a]">
                          {h.name}
                        </td>
                        <td className="py-5 text-right font-bold">{h.qty}</td>
                        <td className="py-5 text-right font-medium text-slate-500">
                          {h.totalBuy.toLocaleString()}
                        </td>
                        <td className="py-5 text-right font-black text-blue-600">
                          {h.cur.toLocaleString()}
                        </td>
                        <td
                          className={`py-5 text-right font-bold ${h.rate >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.rate.toFixed(2)}%
                        </td>
                        <td
                          className={`py-5 text-right font-black ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.dailyProfit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. 거래관리 탭 (이미지 레이아웃 반영) */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-[#f8fafc] p-8 rounded-3xl mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">
                  New Transaction
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      defaultValue="2026-05-15"
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                      Type
                    </label>
                    <select className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold">
                      <option>매수 (Buy)</option>
                      <option>매도 (Sell)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                      Select Asset
                    </label>
                    <select className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold">
                      <option>종목 선택</option>
                      {trades.map((t) => (
                        <option key={t.ticker}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <button className="bg-[#1e293b] text-white p-4 rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200">
                    거래 저장
                  </button>
                </div>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 font-bold border-b border-slate-100 uppercase">
                  <tr>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Asset</th>
                    <th className="pb-4 text-right">Qty</th>
                    <th className="pb-4 text-right">Price</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-5 text-slate-400 font-medium">
                      2026-05-10
                    </td>
                    <td>
                      <span className="bg-rose-50 text-rose-500 px-2 py-1 rounded text-[9px] font-bold">
                        매수
                      </span>
                    </td>
                    <td className="font-black">
                      삼성전자{" "}
                      <span className="text-slate-300 ml-1">005930</span>
                    </td>
                    <td className="text-right font-black">10</td>
                    <td className="text-right font-bold">72,000</td>
                    <td className="text-right font-black">720,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 3. 일별수익률 및 기타 탭 (데이터 시각화) */}
          {activeTab === "일별수익률" && (
            <div className="overflow-x-auto font-bold text-[11px]">
              <table className="w-full text-left">
                <thead className="text-slate-400 border-b">
                  <tr>
                    <th className="pb-4">기준일</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right">일간 손익</th>
                    <th className="pb-4 text-right">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-5">2026-05-15</td>
                    <td className="py-5 text-right font-black">91,912,370</td>
                    <td className="py-5 text-right text-rose-500">
                      -6,570,110
                    </td>
                    <td className="py-5 text-right text-rose-500">-6.67%</td>
                  </tr>
                  <tr>
                    <td className="py-5">2026-05-14</td>
                    <td className="py-5 text-right font-black">98,482,480</td>
                    <td className="py-5 text-right text-emerald-500">
                      +1,569,250
                    </td>
                    <td className="py-5 text-right text-emerald-500">+2.38%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 4. 일별종가 탭 (수집 시간 표기 포함) */}
          {activeTab === "일별종가" && (
            <div>
              <div className="flex gap-4 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <span className="text-[11px] font-black text-blue-700">
                  🇰🇷 한국 수집완료: {lastCollection.kr}
                </span>
                <span className="text-[11px] font-black text-blue-700">
                  🇺🇸 미국 수집완료: {lastCollection.us}
                </span>
              </div>
              <table className="w-full text-[11px] text-left font-bold">
                <thead className="text-slate-400 uppercase border-b">
                  <tr>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Ticker</th>
                    <th className="pb-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyPrices.map((p, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-4 text-slate-400">{p.date}</td>
                      <td className="py-4 font-black">{p.ticker}</td>
                      <td className="py-4 text-right text-blue-600 font-black">
                        {p.price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 추가 탭들(월별, 입출금 등)은 위와 동일한 구조로 데이터 바인딩 */}
          {["월별수익률", "입출금", "보유종목일별", "종목마스터"].includes(
            activeTab,
          ) && (
            <div className="py-20 text-center">
              <p className="text-slate-300 font-black text-sm uppercase tracking-widest">
                {activeTab} DATA LOADING...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
