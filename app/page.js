"use client";

import React, { useState, useMemo } from "react";

export default function PerfectIntegratedSystem() {
  const [activeTab, setActiveTab] = useState("보유현황");

  // --- [1. 마스터 데이터] ---
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
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD", market: "NASDAQ" },
  ]);

  // --- [2. 이미지 6번 기반: 일별 종가 FLAT LIST 데이터] ---
  // 이제 { date: { ticker: price } } 형식이 아니라, 이미지 6번처럼 개별 행(Row)으로 관리합니다.
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
      price: 153000,
      time: "2026-05-15 07:12:23",
    },
    {
      date: "2026-05-14",
      ticker: "KRX:226490",
      name: "kodex 코스피",
      price: 76500,
      time: "2026-05-15 07:12:23",
    },
  ]);

  // --- [3. 보유 종목 고정 데이터] ---
  const [holdings] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      qty: 15,
      buyAmt: 29695000,
      avgPrice: 1979667,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      qty: 120,
      buyAmt: 18578580,
      avgPrice: 154822,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      qty: 128,
      buyAmt: 13162869,
      avgPrice: 102835,
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      qty: 150,
      buyAmt: 6524345,
      avgPrice: 43496,
    },
  ]);

  // --- [4. 통합 계산 로직] ---
  // priceHistory 리스트에서 필요한 날짜의 종가를 찾아 수익률을 계산합니다.
  const summary = useMemo(() => {
    const netInv = 45137473;
    const cash = 78158;

    const calculatedHoldings = holdings.map((h) => {
      // 15일(최신) 가격과 14일(전일) 가격을 리스트에서 조회
      const curEntry = priceHistory.find(
        (p) => p.ticker === h.ticker && p.date === "2026-05-15",
      );
      const preEntry = priceHistory.find(
        (p) => p.ticker === h.ticker && p.date === "2026-05-14",
      );

      const curPrice = curEntry ? curEntry.price : 0;
      const prePrice = preEntry ? preEntry.price : curPrice;

      const evalAmt = h.qty * curPrice;
      const profit = evalAmt - h.buyAmt;
      const dailyProfit = (curPrice - prePrice) * h.qty;

      return {
        ...h,
        curPrice,
        evalAmt,
        profit,
        rate: (profit / h.buyAmt) * 100,
        dailyProfit,
        dailyRate:
          prePrice !== 0 ? ((curPrice - prePrice) / prePrice) * 100 : 0,
      };
    });

    const totalEval = calculatedHoldings.reduce((a, b) => a + b.evalAmt, 0);
    return {
      netInv,
      cash,
      totalEval,
      totalAsset: totalEval + cash,
      calculatedHoldings,
    };
  }, [priceHistory, holdings]);

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
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-800">
      {/* 상단 헤더 & 대시보드 */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Asset Management System
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-[11px] font-black italic">
            코스피 752,817 <span className="text-blue-500">(-5.68%)</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-[11px] font-black italic">
            코스닥 112,848 <span className="text-blue-500">(-5.26%)</span>
          </div>
        </div>
      </div>

      {/* 자산 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "순투자원금", value: summary.netInv.toLocaleString() },
          { label: "총자산", value: summary.totalAsset.toLocaleString() },
          { label: "평가금액", value: summary.totalEval.toLocaleString() },
          { label: "현금", value: summary.cash.toLocaleString() },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              {card.label}
            </p>
            <p className="text-2xl font-black text-slate-900">
              {card.value}{" "}
              <span className="text-sm font-bold text-slate-300">원</span>
            </p>
          </div>
        ))}
      </div>

      {/* 메인 탭 영역 */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="flex bg-slate-50/50 p-2 overflow-x-auto border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${activeTab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* --- 탭: 일별종가 (이미지 6번 수정 및 통합 완료) --- */}
          {activeTab === "일별종가" && (
            <div>
              {/* 이미지 6번 상단 입력 폼 */}
              <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 mb-8 grid grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2">
                    BASE DATE
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-2">
                    TICKER / ASSET
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>
                        {s.ticker} | {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2">
                    CLOSE PRICE
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-blue-600 text-white p-3.5 rounded-xl font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
                  종가 저장
                </button>
              </div>

              {/* 이미지 6번 리스트 테이블 */}
              <div className="flex gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6 text-[11px] font-black text-blue-800">
                <span>🇰🇷 한국 최종수집: 2026-05-15 14:09:55</span>
                <span className="text-blue-300">|</span>
                <span>🇺🇸 미국 최종수집: 2026-05-15 08:00:02</span>
              </div>

              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4 text-right">종가</th>
                    <th className="pb-4 text-right px-6">수집시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {priceHistory.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {row.date}
                      </td>
                      <td className="py-4 text-slate-500">{row.ticker}</td>
                      <td className="py-4 font-black text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-4 text-right text-blue-600 font-black">
                        {row.price.toLocaleString()}
                      </td>
                      <td className="py-4 text-right px-6 text-slate-400 font-medium">
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- 탭: 보유현황 (수정된 리스트 기반 실시간 반영) --- */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                최신종가 기준시각: 2026. 5. 15. 오후 2:09:55 | 소스: NaverRT 4
              </p>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 border-b font-bold">
                  <tr>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4 text-right">보유수량</th>
                    <th className="pb-4 text-right">평균단가</th>
                    <th className="pb-4 text-right">최신종가</th>
                    <th className="pb-4 text-right px-4">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold">
                  {summary.calculatedHoldings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-5 text-slate-400">{h.ticker}</td>
                      <td className="py-5 font-black text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-5 text-right">{h.qty}</td>
                      <td className="py-5 text-right text-slate-400">
                        {h.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-5 text-right text-blue-600 font-black">
                        {h.curPrice.toLocaleString()}
                      </td>
                      <td
                        className={`py-5 text-right px-4 font-black ${h.rate >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.rate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ... 나머지 탭(일별수익률 등)은 생략하나 위와 동일한 summary.calculatedHoldings를 사용하면 자동 연동됩니다. ... */}
        </div>
      </div>
    </div>
  );
}
