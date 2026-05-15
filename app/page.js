"use client";

import React, { useState } from "react";

/**
 * [MY PORTFOLIO FULL SYSTEM - 통합본]
 * - 디자인 변경 금지 원칙 준수
 * - 사진과 동일한 상단 지수 영역 배치 (우측 상단)
 * - '보유종목일별' 포함 모든 탭을 표(Table) 형식으로 구현
 */

export default function PortfolioApp() {
  const [activeTab, setActiveTab] = useState("입출금");

  // --- [1. 데이터 상태 관리] ---

  // 입출금 데이터 (배당금 11건 포함)
  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      date: "2026-05-06",
      type: "입금",
      amount: 4914,
      memo: "Ai핵심 배당금",
    },
    {
      id: 2,
      date: "2026-05-06",
      type: "입금",
      amount: 16880,
      memo: "반도체 배당금",
    },
    {
      id: 3,
      date: "2026-05-06",
      type: "입금",
      amount: 70200,
      memo: "코스피 배당금",
    },
    {
      id: 4,
      date: "2026-04-24",
      type: "입금",
      amount: 13125,
      memo: "하이닉스배당금",
    },
    {
      id: 5,
      date: "2026-04-17",
      type: "입금",
      amount: 19170,
      memo: "삼성배당금",
    },
    {
      id: 6,
      date: "2026-03-04",
      type: "입금",
      amount: 156,
      memo: "plus고배당 배당",
    },
    {
      id: 7,
      date: "2026-02-03",
      type: "입금",
      amount: 4088,
      memo: "tiger반도체 배당",
    },
    {
      id: 8,
      date: "2026-02-03",
      type: "입금",
      amount: 2080,
      memo: "kodex200배당",
    },
    {
      id: 9,
      date: "2026-01-05",
      type: "입금",
      amount: 2360,
      memo: "은선물 배당",
    },
    {
      id: 10,
      date: "2025-12-24",
      type: "입금",
      amount: 3000,
      memo: "메타 배당금",
    },
    {
      id: 11,
      date: "2025-12-16",
      type: "입금",
      amount: 1500,
      memo: "알파벳 배당금",
    },
  ]);

  // 보유현황 데이터
  const [holdings, setHoldings] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      currency: "KRW",
      qty: 15,
      invest: 29695000,
      avg: 1979667,
      current: 1841000,
      eval: 27615000,
      profit: -2080000,
      yield: -7.0,
      dayProfit: -1935000,
      dayYield: -6.55,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      currency: "KRW",
      qty: 120,
      invest: 18578580,
      avg: 154822,
      current: 274000,
      eval: 32880000,
      profit: 14301420,
      yield: 76.98,
      dayProfit: -2640000,
      dayYield: -7.43,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      currency: "KRW",
      qty: 128,
      invest: 13162869,
      avg: 102835,
      current: 153870,
      eval: 19695360,
      profit: 6532491,
      yield: 49.63,
      dayProfit: -1477120,
      dayYield: -6.98,
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      currency: "KRW",
      qty: 150,
      invest: 6524345,
      avg: 43496,
      current: 77600,
      eval: 11640000,
      profit: 5115655,
      yield: 78.41,
      dayProfit: -600000,
      dayYield: -4.9,
    },
  ]);

  // 일별 수익률 데이터
  const [dailyReturns, setDailyReturns] = useState([
    {
      date: "2026-05-15",
      type: "실시간",
      evalAmt: 91912370,
      flow: 0,
      dayProfit: -6570110,
      dayYield: -6.67,
      totalProfit: 46845139.38,
    },
    {
      date: "2026-05-14",
      type: "종가",
      evalAmt: 98482480,
      flow: -30992280,
      dayProfit: 1569250,
      dayYield: 2.38,
      totalProfit: 53415249.38,
    },
    {
      date: "2026-05-13",
      type: "종가",
      evalAmt: 65920950,
      flow: 0,
      dayProfit: 1752900,
      dayYield: 2.73,
      totalProfit: 51845999.38,
    },
  ]);

  // 거래 내역 데이터
  const [transactions, setTransactions] = useState([
    {
      id: 101,
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
      id: 102,
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

  // 일별 종가 데이터
  const [dailyPrices, setDailyPrices] = useState([
    {
      id: 1,
      date: "2026-05-15",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      price: 1841000,
      time: "2026-05-15 14:09:55",
    },
    {
      id: 2,
      date: "2026-05-15",
      ticker: "KRX:005930",
      name: "삼성전자",
      price: 274000,
      time: "2026-05-15 14:09:55",
    },
  ]);

  // --- [2. UI 컴포넌트] ---

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      {/* [헤더 섹션: 타이틀 및 지수] */}
      <div className="mx-auto max-w-[1600px] flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">
            MY PORTFOLIO
          </h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Asset Management & Tracking System
          </p>
        </div>

        {/* 수정된 지수 영역: 우측 상단 배치 */}
        <div className="flex gap-2">
          <div className="flex gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 items-center">
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-slate-400">
                KOSPI
              </span>
              <span className="text-sm font-black">752,817</span>
              <span className="text-[10px] font-bold text-blue-500">
                (-5.68%)
              </span>
            </div>
            <div className="w-[1px] h-4 bg-slate-200" />
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-slate-400">
                KOSDAQ
              </span>
              <span className="text-sm font-black">112,848</span>
              <span className="text-[10px] font-bold text-blue-500">
                (-5.26%)
              </span>
            </div>
          </div>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-50 shadow-sm transition-all">
            지수 새로고침
          </button>
        </div>
      </div>

      {/* [상단 요약 정보] */}
      <div className="mx-auto max-w-[1600px] grid grid-cols-6 gap-4 mb-10">
        {[
          {
            label: "순투자원금",
            val: "45,137,473",
            sub: "입출금 반영",
            color: "text-slate-900",
          },
          {
            label: "총자산(현금포함)",
            val: "91,908,518",
            sub: "현금 + 수익",
            color: "text-blue-600",
          },
          {
            label: "현금보유",
            val: "78,158",
            sub: "미체결 잔액",
            color: "text-slate-900",
          },
          {
            label: "평가금액",
            val: "91,830,360",
            sub: "주식 가치",
            color: "text-slate-900",
          },
          {
            label: "평가손익",
            val: "91,908,518",
            sub: "총자산-원금",
            color: "text-emerald-500",
          },
          {
            label: "전체수익률",
            val: "0.00%",
            sub: "누적 퍼포먼스",
            color: "text-emerald-500",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">
              {item.label}
            </p>
            <p className={`text-xl font-black ${item.color}`}>
              {item.val}{" "}
              <span className="text-[10px] font-medium text-slate-400">원</span>
            </p>
            <p className="text-[9px] text-slate-300 mt-2 font-bold">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* [메인 컨텐츠 영역] */}
      <div className="mx-auto max-w-[1600px] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* 탭 메뉴 */}
        <div className="flex bg-slate-50 border-b border-slate-100">
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
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-5 text-[11px] font-black transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* 탭 1: 보유현황 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <div className="mb-4 text-[10px] font-bold text-slate-400">
                최신종가 기준시각: 2026. 5. 15. 오후 2:09:55
              </div>
              <table className="w-full text-[11px] text-center font-bold">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                  <tr>
                    <th className="py-3">티커</th>
                    <th>종목명</th>
                    <th>통화</th>
                    <th>보유수량</th>
                    <th>순투자원금</th>
                    <th>평균단가</th>
                    <th>최신종가</th>
                    <th>평가금액</th>
                    <th>평가손익</th>
                    <th>수익률</th>
                    <th>일수익금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-4 text-slate-400">{h.ticker}</td>
                      <td className="font-black">{h.name}</td>
                      <td>{h.currency}</td>
                      <td>{h.qty}</td>
                      <td className="text-right">
                        {h.invest.toLocaleString()}
                      </td>
                      <td className="text-right">{h.avg.toLocaleString()}</td>
                      <td className="text-right text-blue-600">
                        {h.current.toLocaleString()}
                      </td>
                      <td className="text-right">{h.eval.toLocaleString()}</td>
                      <td
                        className={`text-right ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.profit.toLocaleString()}
                      </td>
                      <td
                        className={`text-right ${h.yield >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {h.yield}%
                      </td>
                      <td className="text-right text-rose-500">
                        {h.dayProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 2: 일별수익률 */}
          {activeTab === "일별수익률" && (
            <table className="w-full text-[11px] text-center font-bold">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                <tr>
                  <th className="py-4">기준일</th>
                  <th>기준</th>
                  <th>평가금액</th>
                  <th>당일 현금흐름</th>
                  <th>일간 손익</th>
                  <th>일간 수익률</th>
                  <th>평가손익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyReturns.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-4 text-slate-400">{d.date}</td>
                    <td>{d.type}</td>
                    <td className="text-right pr-10">
                      {d.evalAmt.toLocaleString()}
                    </td>
                    <td className="text-right pr-10">
                      {d.flow.toLocaleString()}
                    </td>
                    <td
                      className={`text-right pr-10 ${d.dayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {d.dayProfit.toLocaleString()}
                    </td>
                    <td
                      className={`text-right pr-10 ${d.dayYield >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {d.dayYield}%
                    </td>
                    <td className="text-right pr-10 text-emerald-600">
                      {d.totalProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 탭 3: 보유종목일별 (차트 대신 표 형식) */}
          {activeTab === "보유종목일별" && (
            <table className="w-full text-[11px] text-left font-bold">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                <tr>
                  <th className="py-4 pl-4">기준일</th>
                  <th>티커</th>
                  <th>종목명</th>
                  <th className="text-right">현재가</th>
                  <th className="text-right">평가금액</th>
                  <th className="text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyPrices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-4 pl-4 text-slate-400">{p.date}</td>
                    <td>{p.ticker}</td>
                    <td className="font-black">{p.name}</td>
                    <td className="text-right text-blue-600">
                      {p.price.toLocaleString()}
                    </td>
                    <td className="text-right">
                      {(p.price * 10).toLocaleString()}
                    </td>
                    <td className="text-center">
                      <button className="text-rose-500">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 탭 5: 입출금 */}
          {activeTab === "입출금" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black italic">CASH FLOW LOG</h2>
              </div>
              <table className="w-full text-[11px] font-bold">
                <thead className="text-slate-400 border-b border-slate-100">
                  <tr className="text-left">
                    <th className="pb-4 pl-4">날짜</th>
                    <th>구분</th>
                    <th className="text-right">금액</th>
                    <th className="pl-10">메모</th>
                    <th className="text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cashFlows.map((cf) => (
                    <tr key={cf.id} className="hover:bg-slate-50/50">
                      <td className="py-4 pl-4 text-slate-400">{cf.date}</td>
                      <td
                        className={
                          cf.type === "입금"
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }
                      >
                        {cf.type}
                      </td>
                      <td className="text-right font-black">
                        {cf.amount.toLocaleString()}
                      </td>
                      <td className="pl-10 text-slate-500 font-medium">
                        {cf.memo}
                      </td>
                      <td className="text-center space-x-4">
                        <button className="text-blue-500 hover:underline">
                          수정
                        </button>
                        <button className="text-rose-500 hover:underline">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 6: 거래관리 */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 grid grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border-slate-200 rounded-lg p-2 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Type
                  </label>
                  <select className="w-full border-slate-200 rounded-lg p-2 text-xs font-bold">
                    <option>매수 (Buy)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Asset
                  </label>
                  <select className="w-full border-slate-200 rounded-lg p-2 text-xs font-bold">
                    <option>종목 선택</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Qty
                  </label>
                  <input
                    type="number"
                    className="w-full border-slate-200 rounded-lg p-2 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full bg-[#1e293b] text-white py-2 rounded-lg font-black text-xs">
                    거래 저장
                  </button>
                </div>
              </div>
              <table className="w-full text-[11px] font-bold">
                <thead className="text-slate-400 border-b border-slate-100 text-left">
                  <tr>
                    <th className="pb-4 pl-4">DATE</th>
                    <th>TYPE</th>
                    <th>ASSET</th>
                    <th className="text-right">QTY</th>
                    <th className="text-right">PRICE</th>
                    <th className="text-right">TOTAL</th>
                    <th className="text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-4 pl-4 text-slate-400">{t.date}</td>
                      <td>
                        <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded">
                          매수
                        </span>
                      </td>
                      <td className="font-black">{t.name}</td>
                      <td className="text-right">{t.qty}</td>
                      <td className="text-right">{t.price.toLocaleString()}</td>
                      <td className="text-right font-black">
                        {(t.qty * t.price).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <button className="text-slate-300 hover:text-rose-500">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 8: 일별종가 */}
          {activeTab === "일별종가" && (
            <div>
              <div className="bg-blue-50/30 p-6 rounded-2xl mb-6 border border-blue-100 flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase">
                    Base Date
                  </label>
                  <input
                    type="date"
                    className="w-full border-blue-100 rounded-lg p-2 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="flex-[2] space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase">
                    Asset
                  </label>
                  <select className="w-full border-blue-100 rounded-lg p-2 text-xs font-bold">
                    <option>KRX:000660 | SK하이닉스</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full border-blue-100 rounded-lg p-2 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-blue-600 text-white px-8 py-2 rounded-lg font-black text-xs shadow-lg shadow-blue-200">
                  종가 저장
                </button>
              </div>
              <div className="text-[10px] font-bold text-blue-600 mb-6 px-4 py-2 bg-blue-50 rounded-lg inline-block">
                KR 한국 최종수집: 2026-05-15 14:09:55 | US 미국 최종수집:
                2026-05-15 08:00:02
              </div>
              <table className="w-full text-[11px] font-bold text-left">
                <thead className="text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-4 pl-4">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-right">종가</th>
                    <th className="text-right">수집시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dailyPrices.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-4 pl-4 text-slate-400">{p.date}</td>
                      <td>{p.ticker}</td>
                      <td className="font-black">{p.name}</td>
                      <td className="text-right text-blue-600 font-black">
                        {p.price.toLocaleString()}
                      </td>
                      <td className="text-right text-slate-300 font-normal">
                        {p.time}
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
