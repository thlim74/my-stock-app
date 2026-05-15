"use client";

import React, { useState, useMemo } from "react";

export default function CompletePortfolioSystem() {
  const [activeTab, setActiveTab] = useState("보유현황");

  // --- [1. 데이터 소스 초기 설정] ---

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

  // 일별 종가 데이터 (이미지 2, 3, 4 기반)
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

  // 입출금 내역 데이터
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280, memo: "계좌이체" },
    { date: "2026-05-12", type: "출금", amount: 3341518, memo: "카드결제" },
    { date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
    { date: "2026-05-04", type: "입금", amount: 7487976, memo: "입금" },
  ]);

  // 보유 종목 기본 데이터
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

  // --- [2. 핵심 계산 로직] ---
  const summary = useMemo(() => {
    const netInv = 45137473; // 순투자원금
    const cash = 78158; // 현금

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
      const profit = evalAmt - h.buyAmt;
      const dailyProfit = (curPrice - prePrice) * h.qty;
      const dailyRate =
        prePrice !== 0 ? ((curPrice - prePrice) / prePrice) * 100 : 0;

      return {
        ...h,
        curPrice,
        evalAmt,
        profit,
        rate: (profit / h.buyAmt) * 100,
        dailyProfit,
        dailyRate,
      };
    });

    const totalEval = calculatedHoldings.reduce(
      (acc, obj) => acc + obj.evalAmt,
      0,
    );
    return {
      netInv,
      cash,
      totalEval,
      totalAsset: totalEval + cash,
      calculatedHoldings,
    };
  }, [priceHistory, holdingsData]);

  // --- [3. UI 핸들러] ---
  const deletePriceRow = (index) => {
    if (confirm("삭제하시겠습니까?")) {
      setPriceHistory((prev) => prev.filter((_, i) => i !== index));
    }
  };

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
      {/* 상단 헤더 및 지수 (이미지 1, 4 기반 5개 지수 구성) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tighter">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
            Asset Management System
          </p>
        </div>
        <button className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold shadow-sm hover:bg-slate-50 transition-all">
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

      {/* 자산 요약 (이미지 1 기반) */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "순투자원금", val: summary.netInv },
          { label: "총자산", val: summary.totalAsset },
          { label: "평가금액", val: summary.totalEval },
          { label: "현금", val: summary.cash },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {c.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {c.val.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-300">원</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* 탭 네비게이션 */}
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
          {/* 탭: 보유현황 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                최신종가 기준시각: 2026. 5. 15. 오후 2:09:55 | 소스: NaverRT 4
              </p>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 border-b font-bold font-bold">
                  <tr>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4 text-right">보유수량</th>
                    <th className="pb-4 text-right">평균단가</th>
                    <th className="pb-4 text-right">최신종가</th>
                    <th className="pb-4 text-right">평가금액</th>
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
                      <td className="py-5 text-right font-black">
                        {h.evalAmt.toLocaleString()}
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

          {/* 탭: 일별수익률 */}
          {activeTab === "일별수익률" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th>구분</th>
                    <th className="text-right">평가금액</th>
                    <th className="text-right">당일 입출금</th>
                    <th className="text-right">일간 손익</th>
                    <th className="text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50">
                    <td className="py-5 px-4 text-slate-500 font-medium">
                      2026-05-15
                    </td>
                    <td>실시간</td>
                    <td className="text-right font-black">91,912,370</td>
                    <td className="text-right">0</td>
                    <td className="text-right text-rose-500">-6,570,110</td>
                    <td className="text-right px-4 text-emerald-500">
                      46,845,139.38
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 탭: 입출금 */}
          {activeTab === "입출금" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
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
                      <td className="py-4 text-slate-500 font-medium">
                        {cf.date}
                      </td>
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
                      <td className="text-right px-6 text-slate-400 font-medium">
                        {cf.memo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭: 종목마스터 */}
          {activeTab === "종목마스터" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4">통화</th>
                    <th className="pb-4">상장시장</th>
                    <th className="pb-4 text-right px-4">상태</th>
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
                        <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                          활성
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭: 거래관리 */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100 mb-8 grid grid-cols-11 gap-4 items-end">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Type
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>매수 (Buy)</option>
                    <option>매도 (Sell)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>종목 선택</option>
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Qty
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Unit Price
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
                    <th className="pb-4 text-right">Total</th>
                    <th className="pb-4 text-right px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/50 transition-all font-bold">
                    <td className="py-6 text-slate-400">2026-05-10</td>
                    <td>
                      <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-[10px]">
                        매수
                      </span>
                    </td>
                    <td className="text-slate-900 font-black">
                      삼성전자{" "}
                      <span className="text-slate-300 font-medium ml-1">
                        005930
                      </span>
                    </td>
                    <td className="text-center">10</td>
                    <td className="text-center text-slate-400">72,000</td>
                    <td className="text-right font-black">720,000</td>
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

          {/* 탭: 일별종가 */}
          {activeTab === "일별종가" && (
            <div>
              <div className="bg-slate-50/80 p-8 rounded-[24px] border border-slate-100 mb-8 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Base Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>KRX:000660 | SK하이닉스</option>
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>
                        {s.ticker} | {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-[#2563eb] text-white px-8 py-3.5 rounded-xl font-black text-[11px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  종가 추가
                </button>
              </div>
              <div className="flex gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6 text-[10px] font-bold text-blue-700">
                <span>🇰🇷 한국 최종수집: 2026-05-15 14:09:55</span>
                <span className="text-blue-200">|</span>
                <span>🇺🇸 미국 최종수집: 2026-05-15 08:00:02</span>
              </div>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4 font-bold">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-center font-bold">종가</th>
                    <th className="text-center font-bold">수집시각</th>
                    <th className="text-right px-4 font-bold">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {priceHistory.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-400">{r.date}</td>
                      <td className="text-slate-500">{r.ticker}</td>
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
                        <button
                          onClick={() => deletePriceRow(i)}
                          className="bg-rose-50 text-rose-500 px-3 py-1 rounded-md text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all"
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

          {/* 탭: 보유종목일별 */}
          {activeTab === "보유종목일별" && (
            <div>
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
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
                  기간 조회
                </button>
              </div>
              <table className="w-full text-left text-[10px] font-bold border-collapse font-bold">
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
                    <td className="text-right text-rose-500">
                      -6,603,110 (-6.70%)
                    </td>
                    <td className="text-right text-emerald-500">
                      1,569,250 (2.38%)
                    </td>
                    <td className="text-right p-4 text-emerald-500">
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

          {/* 탭: 월별수익률 */}
          {activeTab === "월별수익률" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-bold border-collapse">
                <thead className="bg-[#f1f5f9] text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="p-4">월</th>
                    <th>월초평가액</th>
                    <th>월말평가액</th>
                    <th className="text-right">월간 손익(보정)</th>
                    <th className="text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr>
                    <td className="p-4 text-slate-500">2026-05</td>
                    <td className="font-medium">77,986,020</td>
                    <td className="font-black text-slate-900">91,880,010</td>
                    <td className="text-right text-emerald-500">
                      13,863,827 (17.78%)
                    </td>
                    <td className="text-right px-4 text-emerald-500">
                      46,812,779.38
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-500">2026-04</td>
                    <td className="font-medium">55,040,000</td>
                    <td className="font-black text-slate-900">77,986,020</td>
                    <td className="text-right text-emerald-500">
                      22,920,761 (41.64%)
                    </td>
                    <td className="text-right px-4 text-emerald-500">
                      32,948,952.38
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
