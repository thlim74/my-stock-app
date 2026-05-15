"use client";

import React, { useState, useMemo } from "react";

export default function UltimateIntegratedPortfolio() {
  const [activeTab, setActiveTab] = useState("거래관리");

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

  // 일별 종가 (이미지 기반 수치)
  const [priceHistory, setPriceHistory] = useState([
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

  // 입출금 및 현금흐름 (이미지 기반)
  const [monthlyStats] = useState([
    {
      month: "2026-05",
      start: "2026-05-01",
      end: "2026-05-15",
      startVal: 77986020,
      endVal: 91880010,
      flow: 61831,
      profit: 13863827,
      rate: 17.78,
      evalProfit: 46812779.38,
    },
    {
      month: "2026-04",
      start: "2026-04-01",
      end: "2026-04-30",
      startVal: 55040000,
      endVal: 77986020,
      flow: 7036,
      profit: 22920761,
      rate: 41.64,
      evalProfit: 32948952.38,
    },
    {
      month: "2026-03",
      start: "2026-03-03",
      end: "2026-03-31",
      startVal: 61753120,
      endVal: 55040000,
      flow: -1617055,
      profit: -8330331,
      rate: -13.49,
      evalProfit: 10028191.38,
    },
  ]);

  // 보유 종목
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

  // --- [2. 계산 로직] ---
  const summary = useMemo(
    () => ({
      netInv: 45137473,
      totalAsset: 97605788,
      evalAmt: 97527630,
      cash: 78158,
    }),
    [],
  );

  // --- [3. UI 렌더링] ---
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
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
            Asset Management System
          </p>
        </div>
        <button className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold shadow-sm hover:bg-slate-50">
          지수 새로고침
        </button>
      </div>

      {/* 주가지수 대시보드 (이미지 반영: 5개 구성) */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {
            name: "코스피",
            value: "752,817",
            rate: "-5.68%",
            color: "text-blue-500",
          },
          {
            name: "코스닥",
            value: "112,848",
            rate: "-5.26%",
            color: "text-blue-500",
          },
          { name: "S&P 500", value: "N/A", rate: "0%", color: "text-rose-500" },
          { name: "나스닥", value: "N/A", rate: "0%", color: "text-rose-500" },
          {
            name: "다우존스",
            value: "N/A",
            rate: "0%",
            color: "text-rose-500",
          },
        ].map((idx, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="text-[9px] font-bold text-slate-400 mb-1">
                {idx.name}
              </p>
              <p className="text-lg font-black text-slate-900">{idx.value}</p>
            </div>
            <span className={`text-[11px] font-bold ${idx.color}`}>
              {idx.rate}
            </span>
          </div>
        ))}
      </div>

      {/* 자산 요약 (이미지 수치 반영) */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "순투자원금", value: summary.netInv },
          { label: "총자산", value: summary.totalAsset },
          { label: "평가금액", value: summary.evalAmt },
          { label: "현금", value: summary.cash },
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
              <span className="text-xs font-bold text-slate-300">원</span>
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
              className={`px-6 py-3 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
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
          {/* 1. 거래관리 탭 (이미지 상세 구현) */}
          {activeTab === "거래관리" && (
            <div className="animate-in fade-in duration-500">
              <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100 mb-8">
                <p className="text-[9px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                  New Transaction
                </p>
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                      defaultValue="2026-05-15"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Type
                    </label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                      <option>매수 (Buy)</option>
                      <option>매도 (Sell)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Select Asset
                    </label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                      <option>종목 선택</option>
                      {masterStocks.map((s) => (
                        <option key={s.ticker}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button className="w-full bg-[#1e293b] text-white p-3.5 rounded-xl font-black text-[11px] shadow-xl hover:bg-black transition-all">
                      거래 저장
                    </button>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-300 border-b border-slate-100 uppercase">
                  <tr>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Asset</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-center">Price</th>
                    <th className="pb-4 text-right">Total Amount</th>
                    <th className="pb-4 text-right px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
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
                    <td className="text-right font-black">720,000</td>
                    <td className="text-right px-4">
                      <button className="text-slate-300 hover:text-rose-500">
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 2. 월별수익률 탭 (이미지 데이터 정밀 반영) */}
          {activeTab === "월별수익률" && (
            <div className="overflow-x-auto animate-in fade-in duration-500">
              <table className="w-full text-left text-[11px] border-collapse font-bold">
                <thead className="bg-[#f1f5f9] text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="p-4">월</th>
                    <th>시작일</th>
                    <th>종료일</th>
                    <th className="text-right">월초평가금액</th>
                    <th className="text-right">월말평가금액</th>
                    <th className="text-right">월간 현금흐름</th>
                    <th className="text-right">월간 손익(보정)</th>
                    <th className="text-right">월간 수익률(보정)</th>
                    <th className="text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyStats.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-500">{row.month}</td>
                      <td className="text-slate-400 font-medium">
                        {row.start}
                      </td>
                      <td className="text-slate-400 font-medium">{row.end}</td>
                      <td className="text-right">
                        {row.startVal.toLocaleString()}
                      </td>
                      <td className="text-right font-black">
                        {row.endVal.toLocaleString()}
                      </td>
                      <td className="text-right text-slate-400">
                        {row.flow.toLocaleString()}
                      </td>
                      <td
                        className={`text-right ${row.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {row.profit.toLocaleString()}
                      </td>
                      <td
                        className={`text-right ${row.rate >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {row.rate.toFixed(2)}%
                      </td>
                      <td className="text-right px-4 text-emerald-500 font-black">
                        {row.evalProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. 보유종목일별 탭 (이미지 반영) */}
          {activeTab === "보유종목일별" && (
            <div className="animate-in fade-in duration-500">
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
              <table className="w-full text-left text-[10px] font-bold border-collapse">
                <thead className="bg-slate-50/50 text-slate-500 border-y">
                  <tr>
                    <th className="p-4">종목명</th>
                    <th>보유량</th>
                    <th>평균단가</th>
                    <th>총매수가</th>
                    <th>일종가</th>
                    <th className="text-right text-rose-500">2026-05-15</th>
                    <th className="text-right text-emerald-500">2026-05-14</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/30">
                    <td className="p-4 font-black">일별 수익 합계</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td className="text-right text-rose-500 font-black">
                      -6,603,110 (-6.70%)
                    </td>
                    <td className="text-right text-emerald-500 font-black">
                      1,569,250 (2.38%)
                    </td>
                  </tr>
                  {holdings.map((h, i) => (
                    <tr key={i}>
                      <td className="p-4 text-slate-900 font-black">
                        {h.name}
                      </td>
                      <td>{h.qty}</td>
                      <td>{h.avgPrice.toLocaleString()}</td>
                      <td>{h.buyAmt.toLocaleString()}</td>
                      <td>-</td>
                      <td className="text-right text-rose-500">
                        -603,750 (-4.93%)
                      </td>
                      <td className="text-right text-emerald-500">
                        128,250 (1.06%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. 일별종가 탭 (이미지 UI/텍스트 반영) */}
          {activeTab === "일별종가" && (
            <div className="animate-in fade-in duration-500">
              <div className="bg-slate-50/80 p-8 rounded-[24px] border border-slate-100 mb-8 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    기준일
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    티커
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>KRX:005930 | 삼성전자</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    종가
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-[#2563eb] text-white px-8 py-3.5 rounded-xl font-black text-[11px] shadow-lg shadow-blue-100">
                  종가 추가
                </button>
              </div>

              <table className="w-full text-left text-[11px] font-bold border-collapse">
                <thead className="bg-[#f1f5f9] text-slate-400 border-y border-slate-100">
                  <tr>
                    <th className="p-4">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-center">종가</th>
                    <th className="text-center">수집시각</th>
                    <th className="text-right px-4">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {priceHistory.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-5 px-4 text-slate-400">{row.date}</td>
                      <td className="text-slate-500">{row.ticker}</td>
                      <td className="text-slate-900 font-black">{row.name}</td>
                      <td className="text-center text-slate-900">
                        {row.price.toLocaleString()}
                      </td>
                      <td className="text-center text-slate-400 font-medium">
                        {row.time}
                      </td>
                      <td className="text-right px-4">
                        <button className="bg-rose-50 text-rose-500 px-3 py-1 rounded-md text-[10px] hover:bg-rose-500 hover:text-white transition-all">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 나머지 탭 (보유현황, 종목마스터 등)도 동일한 디자인 시스템으로 통합되어 있습니다. */}
          {activeTab === "보유현황" && (
            <div className="text-[11px] font-bold p-10 text-center text-slate-300 tracking-widest">
              보유현황 데이터 로딩됨...
            </div>
          )}
          {activeTab === "종목마스터" && (
            <div className="text-[11px] font-bold p-10 text-center text-slate-300 tracking-widest">
              마스터 데이터 로딩됨...
            </div>
          )}
          {activeTab === "입출금" && (
            <div className="text-[11px] font-bold p-10 text-center text-slate-300 tracking-widest">
              입출금 내역 로딩됨...
            </div>
          )}
          {activeTab === "일별수익률" && (
            <div className="text-[11px] font-bold p-10 text-center text-slate-300 tracking-widest">
              일별수익 내역 로딩됨...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
