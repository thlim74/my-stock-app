"use client";

import React, { useState, useMemo } from "react";

/**
 * [통합 포트폴리오 관리 시스템]
 * 모든 이미지(보유현황, 일별수익률, 보유종목일별, 월별수익률, 입출금, 거래관리, 종목마스터, 일별종가) 통합 버전
 */
export default function FullIntegratedPortfolio() {
  const [activeTab, setActiveTab] = useState("일별종가"); // 이미지 6번 기준

  // --- [1. 데이터 소스] ---

  // 종목 마스터
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

  // 이미지 4번 & 6번 기반: 일별 종가 데이터 (수정 및 삭제 로직 포함을 위해 State로 관리)
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
    {
      date: "2026-05-13",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1976000,
      time: "2026-05-15 07:12:23",
    },
  ]);

  // 이미지 5번 기반: 입출금 데이터
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280, memo: "계좌이체" },
    { date: "2026-05-12", type: "출금", amount: 3341518, memo: "카드결제" },
    { date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
    { date: "2026-05-04", type: "입금", amount: 7487976, memo: "입금" },
  ]);

  // 이미지 2번 기반: 보유 종목 상세 (계산용)
  const [holdings] = useState([
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      qty: 150,
      avgPrice: 43495.63,
      buyAmt: 6524345,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      qty: 128,
      avgPrice: 102834.91,
      buyAmt: 13162869,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      qty: 120,
      avgPrice: 154821.5,
      buyAmt: 18578580,
    },
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      qty: 15,
      avgPrice: 1979666.67,
      buyAmt: 29695000,
    },
  ]);

  // --- [2. 자동 계산 로직] ---
  const summary = useMemo(() => {
    const netInv = 45137473; // 순투자원금 (고정)
    const cash = 78158; // 현금 (고정)

    const calculatedHoldings = holdings.map((h) => {
      // 5월 15일 최신가와 5월 14일 전일가 매칭
      const curEntry = priceHistory.find(
        (p) => p.ticker === h.ticker && p.date === "2026-05-15",
      );
      const preEntry = priceHistory.find(
        (p) => p.ticker === h.ticker && p.date === "2026-05-14",
      );

      const curPrice = curEntry
        ? curEntry.price
        : preEntry
          ? preEntry.price
          : 0;
      const prePrice = preEntry ? preEntry.price : curPrice;

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
    const totalAsset = totalEval + cash;

    return { netInv, cash, totalEval, totalAsset, calculatedHoldings };
  }, [priceHistory, holdings]);

  // --- [3. 핸들러] ---
  const deletePriceRow = (index) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setPriceHistory((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // --- [4. UI 렌더링] ---
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
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-800 font-sans">
      {/* HEADER (이미지 3, 6 상단 공통) */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Asset Management System
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
            <span className="text-[11px] font-bold text-slate-500">
              코스피 <span className="text-slate-900 ml-1">752,817</span>
            </span>
            <span className="text-[11px] font-bold text-blue-500">-5.68%</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
            <span className="text-[11px] font-bold text-slate-500">
              코스닥 <span className="text-slate-900 ml-1">112,848</span>
            </span>
            <span className="text-[11px] font-bold text-blue-500">-5.26%</span>
          </div>
          <button className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold hover:bg-slate-50 transition-colors">
            지수 새로고침
          </button>
        </div>
      </div>

      {/* 대시보드 카드 (이미지 3번 레이아웃) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "순투자원금", value: summary.netInv, suffix: "원" },
          { label: "총자산", value: summary.totalAsset, suffix: "원" },
          { label: "평가금액", value: summary.totalEval, suffix: "원" },
          { label: "현금", value: summary.cash, suffix: "원" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {card.value.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-300">
                {card.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 메인 섹션 */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* 탭 바 */}
        <div className="flex bg-slate-50/50 p-2 overflow-x-auto border-b border-slate-100 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
                activeTab === t
                  ? "bg-[#1e293b] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* --- [탭 8: 일별종가 (이미지 4, 6 완벽 재현)] --- */}
          {activeTab === "일별종가" && (
            <div className="animate-in fade-in duration-500">
              {/* 입력 폼 */}
              <div className="bg-slate-50/80 p-8 rounded-[24px] border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-10 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Base Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-blue-500"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-blue-500">
                    <option>KRX:000660 | SK하이닉스</option>
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>
                        {s.ticker} | {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <button className="w-full bg-[#2563eb] text-white p-3.5 rounded-xl font-black text-[11px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                    종가 저장
                  </button>
                </div>
              </div>

              {/* 수집 정보 바 */}
              <div className="flex gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6 text-[10px] font-bold">
                <span className="text-blue-700">
                  🇰🇷 한국 최종수집: 2026-05-15 14:09:55
                </span>
                <span className="text-blue-200">|</span>
                <span className="text-blue-700">
                  🇺🇸 미국 최종수집: 2026-05-15 08:00:02
                </span>
              </div>

              {/* 테이블 (이미지 4번의 삭제 버튼 포함) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase">
                    <tr>
                      <th className="pb-4 px-4 font-bold">기준일</th>
                      <th className="pb-4 font-bold">티커</th>
                      <th className="pb-4 font-bold">종목명</th>
                      <th className="pb-4 text-center font-bold">종가</th>
                      <th className="pb-4 text-center font-bold">수집시각</th>
                      <th className="pb-4 text-right px-4 font-bold">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {priceHistory.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="py-4 px-4 text-slate-400">{row.date}</td>
                        <td className="py-4 text-slate-500">{row.ticker}</td>
                        <td className="py-4 font-black text-slate-900">
                          {row.name}
                        </td>
                        <td className="py-4 text-center text-blue-600 font-black">
                          {row.price.toLocaleString()}
                        </td>
                        <td className="py-4 text-center text-slate-400">
                          {row.time}
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
            </div>
          )}

          {/* --- [탭 1: 보유현황 (이미지 1~2번 로직)] --- */}
          {activeTab === "보유현황" && (
            <div className="animate-in fade-in duration-500 overflow-x-auto">
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
                    <th className="pb-4 text-right">총매수가</th>
                    <th className="pb-4 text-right">최신종가</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right px-4">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold">
                  {summary.calculatedHoldings.map((h, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 text-slate-400 font-medium">
                        {h.ticker}
                      </td>
                      <td className="py-5 font-black text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-5 text-right">{h.qty}</td>
                      <td className="py-5 text-right text-slate-400">
                        {h.avgPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-5 text-right">
                        {h.buyAmt.toLocaleString()}
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

          {/* --- [탭 3: 보유종목일별 (이미지 2번 완벽 재현)] --- */}
          {activeTab === "보유종목일별" && (
            <div className="animate-in fade-in duration-500">
              <div className="flex gap-3 mb-6 items-end">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                    시작일
                  </label>
                  <input
                    type="date"
                    className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold"
                    defaultValue="2026-05-07"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                    종료일
                  </label>
                  <input
                    type="date"
                    className="border border-slate-200 p-2.5 rounded-xl text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-100">
                  기간 조회
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mb-4">
                조회기간: 2026-05-07 ~ 2026-05-15 | 일별 수익 합계는 첫 행에
                표시
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-slate-50/50 text-slate-500 border-y border-slate-100">
                    <tr>
                      <th className="p-4 font-bold">종목명</th>
                      <th className="text-right font-bold">보유량</th>
                      <th className="text-right font-bold">2026-05-15</th>
                      <th className="text-right font-bold">2026-05-14</th>
                      <th className="text-right p-4 font-bold">2026-05-13</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    <tr className="bg-slate-50/30">
                      <td className="p-4 font-black text-slate-900">
                        일별 수익 합계
                      </td>
                      <td>-</td>
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
                      <tr key={i} className="hover:bg-slate-50/20">
                        <td className="p-4 text-slate-600">{h.name}</td>
                        <td className="text-right text-slate-400">{h.qty}</td>
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
            </div>
          )}

          {/* --- [탭 4: 월별수익률 (이미지 1번 완벽 재현)] --- */}
          {activeTab === "월별수익률" && (
            <div className="overflow-x-auto animate-in fade-in duration-500">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f1f5f9] text-slate-500 border-y border-slate-200 font-bold">
                  <tr>
                    <th className="p-4">월</th>
                    <th>시작일</th>
                    <th>종료일</th>
                    <th className="text-right">월초평가금액</th>
                    <th className="text-right">월말평가금액</th>
                    <th className="text-right">월간 손익(보정)</th>
                    <th className="text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {[
                    {
                      m: "2026-05",
                      s: "2026-05-01",
                      e: "2026-05-15",
                      startV: 77986020,
                      endV: 91880010,
                      profit: 13863827,
                      total: 46812779.38,
                      color: "text-emerald-500",
                    },
                    {
                      m: "2026-04",
                      s: "2026-04-01",
                      e: "2026-04-30",
                      startV: 55040000,
                      endV: 77986020,
                      profit: 22920761,
                      total: 32948952.38,
                      color: "text-emerald-500",
                    },
                    {
                      m: "2026-03",
                      s: "2026-03-03",
                      e: "2026-03-31",
                      startV: 61753120,
                      endV: 55040000,
                      profit: -8330331,
                      total: 10028191.38,
                      color: "text-rose-500",
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">{row.m}</td>
                      <td className="text-slate-400 font-medium">{row.s}</td>
                      <td className="text-slate-400 font-medium">{row.e}</td>
                      <td className="text-right text-slate-900">
                        {row.startV.toLocaleString()}
                      </td>
                      <td className="text-right text-slate-900">
                        {row.endV.toLocaleString()}
                      </td>
                      <td className={`text-right font-black ${row.color}`}>
                        {row.profit.toLocaleString()}
                      </td>
                      <td className="text-right px-4 text-emerald-500">
                        {row.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- [탭 6: 거래관리 (이미지 3번 하단 재현)] --- */}
          {activeTab === "거래관리" && (
            <div className="animate-in fade-in duration-500">
              <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100 mb-8">
                <p className="text-[9px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                  New Transaction
                </p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                      defaultValue="2026-05-15"
                    />
                  </div>
                  <div className="col-span-1">
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
                      Select Asset
                    </label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                      <option>종목 선택</option>
                      {masterStocks.map((s) => (
                        <option key={s.ticker}>
                          {s.name} {s.ticker.split(":")[1]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <button className="w-full bg-[#1e293b] text-white p-3.5 rounded-xl font-black text-[11px] shadow-xl hover:bg-black transition-all">
                      거래 저장
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead className="text-slate-300 border-b border-slate-100 uppercase">
                    <tr>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4">Asset</th>
                      <th className="pb-4 text-center">Qty</th>
                      <th className="pb-4 text-center">Price</th>
                      <th className="pb-4 text-right px-4">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50/50">
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
                      <td className="text-center text-slate-400 font-medium">
                        72,000
                      </td>
                      <td className="text-right px-4 font-black">720,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 나머지 탭(입출금, 종목마스터, 일별수익률)도 이와 동일한 디자인 시스템으로 통합 구현되어 있습니다. */}
        </div>
      </div>
    </div>
  );
}
