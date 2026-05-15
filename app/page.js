"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function PortfolioManagementSystem() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("보유현황");
  const [lastCollection, setLastCollection] = useState({
    kr: "2026-05-14 20:10:02",
    us: "2026-05-15 08:00:05",
  });

  // 2. 마스터 데이터 (이미지 기반 샘플)
  const [masterList] = useState([
    { ticker: "KRX:005930", name: "삼성전자", currency: "KRW", market: "KR" },
    { ticker: "KRX:000660", name: "SK하이닉스", currency: "KRW", market: "KR" },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      currency: "KRW",
      market: "KR",
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      currency: "KRW",
      market: "KR",
    },
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD", market: "US" },
  ]);

  // 3. 거래 내역 (순투자원금 및 수량 계산용)
  const [trades] = useState([
    {
      date: "2026-05-14",
      ticker: "KRX:005930",
      type: "매수",
      quantity: 120,
      price: 154822,
      amount: 18578580,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:000660",
      type: "매수",
      quantity: 15,
      price: 1979667,
      amount: 29695000,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:091230",
      type: "매수",
      quantity: 128,
      price: 102835,
      amount: 13162869,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:226490",
      type: "매수",
      quantity: 150,
      price: 43496,
      amount: 6524345,
    },
  ]);

  // 4. 입출금 내역
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280 },
    { date: "2026-05-12", type: "출금", amount: 3341518 },
    { date: "2026-05-08", type: "입금", amount: 26815659 },
    { date: "2026-05-04", type: "입금", amount: 7487976 },
  ]);

  // 5. 일별 종가 데이터 (수집 시간 로직 적용 대상)
  const [dailyPrices, setDailyPrices] = useState([
    { date: "2026-05-15", ticker: "KRX:005930", price: 274000 },
    { date: "2026-05-15", ticker: "KRX:000660", price: 1842000 },
    { date: "2026-05-15", ticker: "KRX:091230", price: 154165 },
    { date: "2026-05-15", ticker: "KRX:226490", price: 77575 },
    { date: "2026-05-14", ticker: "KRX:005930", price: 296000 },
    { date: "2026-05-14", ticker: "KRX:000660", price: 1970000 },
  ]);

  // 6. 자동 수집 스케줄러 시뮬레이션 (KR 20:10 / US 08:00)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const formattedNow = now.toISOString().replace("T", " ").substring(0, 19);

      if (h === 20 && m === 10)
        setLastCollection((prev) => ({ ...prev, kr: formattedNow }));
      if (h === 8 && m === 0)
        setLastCollection((prev) => ({ ...prev, us: formattedNow }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 7. 데이터 가공 (보유현황 및 요약 수치)
  const summary = useMemo(() => {
    const netInv = cashFlows.reduce(
      (a, c) => a + (c.type === "입금" ? c.amount : -c.amount),
      0,
    );
    const holdings = trades.map((t) => {
      const curPrice =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-15",
        )?.price || t.price;
      const prevPrice =
        dailyPrices.find(
          (p) => p.ticker === t.ticker && p.date === "2026-05-14",
        )?.price || t.price;
      return {
        ...t,
        current: curPrice,
        evalAmt: t.quantity * curPrice,
        dailyProfit: (curPrice - prevPrice) * t.quantity,
      };
    });
    const totalEval = holdings.reduce((a, c) => a + c.evalAmt, 0);
    return {
      netInv,
      totalEval,
      holdings,
      profit: totalEval - netInv,
      rate: ((totalEval - netInv) / netInv) * 100,
    };
  }, [trades, cashFlows, dailyPrices]);

  const menuItems = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "일별종가",
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 text-slate-800 font-sans">
      {/* 상단 요약 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6 text-center">
        {[
          { label: "순투자원금", value: summary.netInv.toLocaleString() },
          { label: "평가금액", value: summary.totalEval.toLocaleString() },
          { label: "현금보유", value: "78,158" },
          {
            label: "총자산",
            value: (summary.totalEval + 78158).toLocaleString(),
          },
          {
            label: "평가손익",
            value: summary.profit.toLocaleString(),
            color: summary.profit >= 0 ? "text-emerald-500" : "text-rose-500",
          },
          {
            label: "전체 수익률",
            value: summary.rate.toFixed(2) + "%",
            color: summary.profit >= 0 ? "text-emerald-500" : "text-rose-500",
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
        {/* 탭 네비게이션 */}
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

        {/* 탭 컨텐츠 */}
        <div className="p-0">
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-4 px-6">종목명</th>
                    <th className="py-4 text-center">보유수량</th>
                    <th className="py-4 text-right">평단가</th>
                    <th className="py-4 text-right">최신종가</th>
                    <th className="py-4 text-right">평가금액</th>
                    <th className="py-4 text-right px-6">일수익금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {summary.holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50 font-medium">
                      <td className="py-4 px-6 font-bold">
                        {h.ticker.split(":")[1] || h.ticker}
                      </td>
                      <td className="py-4 text-center font-bold">
                        {h.quantity}
                      </td>
                      <td className="py-4 text-right text-slate-400">
                        {h.price.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-bold text-blue-600">
                        {h.current.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-black">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`py-4 text-right px-6 font-bold ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.dailyProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "일별종가" && (
            <div className="animate-in fade-in">
              {/* 최종 수집 시간 표기 영역 */}
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-slate-600">
                    🇰🇷 한국 최종수집:{" "}
                    <span className="text-blue-700 font-black">
                      {lastCollection.kr}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-slate-600">
                    🇺🇸 미국 최종수집:{" "}
                    <span className="text-blue-700 font-black">
                      {lastCollection.us}
                    </span>
                  </span>
                </div>
                <div className="ml-auto text-[10px] text-slate-400 font-medium italic">
                  * 스케줄: KR 20:10 (AfterMarket) / US 08:00 (Close)
                </div>
              </div>

              {/* 입력 섹션 (보유종목 한정) */}
              <div className="p-6 bg-slate-50/30 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2">
                      보유종목 선택
                    </label>
                    <select className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none">
                      {masterList.map((s) => (
                        <option key={s.ticker}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2">
                      날짜
                    </label>
                    <input
                      type="date"
                      defaultValue="2026-05-15"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2">
                      종가
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <button className="bg-slate-800 text-white p-3 rounded-xl font-black text-xs hover:bg-black transition-all">
                    수동 수집/수정
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="py-4 px-6">수집일자</th>
                      <th className="py-4">티커</th>
                      <th className="py-4 text-right">종가</th>
                      <th className="py-4 text-center px-6">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyPrices.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-bold text-slate-500">
                          {p.date}
                        </td>
                        <td className="py-4 font-black">{p.ticker}</td>
                        <td className="py-4 text-right font-black text-blue-600">
                          {p.price.toLocaleString()}
                        </td>
                        <td className="py-4 text-center px-6">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black">
                            COLLECTED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 나머지 탭은 동일한 UI 구조로 필요에 따라 확장 가능 */}
          {["일별수익률", "보유종목일별", "월별수익률", "입출금"].includes(
            activeTab,
          ) && (
            <div className="py-40 text-center text-slate-300 font-bold text-sm">
              {activeTab} 데이터 분석 및 렌더링 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
