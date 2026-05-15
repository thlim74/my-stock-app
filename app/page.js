"use client";

import React, { useState, useMemo } from "react";

/**
 * [최종 통합 포트폴리오 관리 시스템]
 * 1. 순투자원금: 입출금 내역의 합산 반영
 * 2. 총자산(현금포함): 현재 보유 주식 가치 + 현금 잔액
 * 3. 현금보유: 입출금 총액 - 주식 매수 총액 (로직상 입출금 잔액 기준)
 * 4. 평가손익: 총자산 - 순투자원금
 * 5. 전체 수익률: (평가손익 / 순투자원금) * 100
 */
export default function UltimateIntegratedPortfolio() {
  const [activeTab, setActiveTab] = useState("보유현황");

  // --- [1. 데이터 상태 관리] ---

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

  // 입출금 내역 (순투자원금 및 현금 잔액 계산의 기초)
  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280, memo: "계좌이체" },
    { date: "2026-05-12", type: "출금", amount: 3341518, memo: "카드결제" },
    { date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
    { date: "2026-05-04", type: "입금", amount: 7487976, memo: "입금" },
    // 초기 자본 예시 추가
    { date: "2026-03-01", type: "입금", amount: 45167636, memo: "초기자본" },
  ]);

  // 일별 종가
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

  // 보유 종목
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

  // --- [2. 핵심 통합 계산 로직] ---
  const summary = useMemo(() => {
    // 1. 순투자원금 계산 (입금 총액 - 출금 총액)
    const totalIn = cashFlows
      .filter((cf) => cf.type === "입금")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalOut = cashFlows
      .filter((cf) => cf.type === "출금")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const netInv = totalIn - totalOut;

    // 2. 현재 보유 주식 평가금액 계산
    const calculatedHoldings = holdingsData.map((h) => {
      const curPrice =
        priceHistory.find(
          (p) => p.ticker === h.ticker && p.date === "2026-05-15",
        )?.price || 0;
      const evalAmt = h.qty * curPrice;
      return { ...h, curPrice, evalAmt };
    });
    const totalStockEval = calculatedHoldings.reduce(
      (acc, obj) => acc + obj.evalAmt,
      0,
    );

    // 3. 현금 보유액 계산 (가정: 순투자원금에서 주식 매수 원금을 뺀 나머지)
    const totalBuyAmt = holdingsData.reduce(
      (acc, curr) => acc + curr.buyAmt,
      0,
    );
    const cashBalance = netInv - totalBuyAmt;

    // 4. 총자산(현금포함) = 주식평가액 + 현금잔액
    const totalAsset = totalStockEval + cashBalance;

    // 5. 평가손익 = 총자산 - 순투자원금
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
  const deletePriceRow = (index) => {
    if (confirm("정말 삭제하시겠습니까?")) {
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
      {/* HEADER */}
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

      {/* 지수 대시보드 (5개 구성) */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {["코스피", "코스닥", "S&P 500", "나스닥", "다우존스"].map(
          (name, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[9px] font-bold text-slate-400 mb-1">
                  {name}
                </p>
                <p className="text-lg font-black text-slate-900">
                  {i < 2 ? (i === 0 ? "752,817" : "112,848") : "N/A"}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold ${i < 2 ? "text-blue-500" : "text-rose-500"}`}
              >
                {i < 2 ? "-5.68%" : "0%"}
              </span>
            </div>
          ),
        )}
      </div>

      {/* 자산 요약 요약 카드 (요청 사항 반영) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {[
          { label: "순투자원금", val: summary.netInv, color: "text-slate-900" },
          {
            label: "총자산(현금포함)",
            val: summary.totalAsset,
            color: "text-slate-900",
          },
          {
            label: "현금보유",
            val: summary.cashBalance,
            color: "text-slate-900",
          },
          {
            label: "평가손익",
            val: summary.totalProfit,
            color:
              summary.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500",
          },
          {
            label: "전체 수익률",
            val: summary.totalRate.toFixed(2) + "%",
            color:
              summary.totalRate >= 0 ? "text-emerald-500" : "text-rose-500",
            isRate: true,
          },
          {
            label: "주식평가액",
            val: summary.totalStockEval,
            color: "text-blue-600",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${card.color}`}>
                {card.isRate ? card.val : card.val.toLocaleString()}
              </span>
              {!card.isRate && (
                <span className="text-[10px] font-bold text-slate-300">원</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 메인 탭 영역 */}
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
          {/* [보유현황] */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 border-b font-bold uppercase">
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
                      <td className="py-5 text-right text-blue-600">
                        {h.curPrice.toLocaleString()}
                      </td>
                      <td className="py-5 text-right">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`py-5 text-right px-4 ${h.evalAmt - h.buyAmt >= 0 ? "text-emerald-500" : "text-rose-500"}`}
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

          {/* [입출금] */}
          {activeTab === "입출금" && (
            <div className="overflow-x-auto">
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

          {/* [거래관리] */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-slate-50/50 p-8 rounded-[24px] border border-slate-100 mb-8 grid grid-cols-11 gap-4 items-end font-bold">
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
                    <option>매수</option>
                    <option>매도</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 mb-2 block uppercase">
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
              <p className="text-center text-slate-300 font-bold py-10">
                거래 내역이 표시되는 영역입니다.
              </p>
            </div>
          )}

          {/* [종목마스터] */}
          {activeTab === "종목마스터" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4">티커</th>
                    <th className="pb-4">종목명</th>
                    <th className="pb-4">통화</th>
                    <th className="pb-4">시장</th>
                    <th className="pb-4 text-right px-4">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterStocks.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-4 text-slate-400">{s.ticker}</td>
                      <td className="font-black text-slate-900">{s.name}</td>
                      <td>{s.currency}</td>
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

          {/* [일별종가] */}
          {activeTab === "일별종가" && (
            <div>
              <div className="bg-slate-50/80 p-8 rounded-[24px] border border-slate-100 mb-8 flex gap-4 items-end font-bold">
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
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
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
                <button className="bg-[#2563eb] text-white px-8 py-3.5 rounded-xl font-black text-[11px] shadow-lg shadow-blue-100">
                  종가 추가
                </button>
              </div>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-center">종가</th>
                    <th className="text-center">수집시각</th>
                    <th className="text-right px-4">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {priceHistory.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/30">
                      <td className="py-4 px-4 text-slate-400">{r.date}</td>
                      <td className="text-slate-500">{r.ticker}</td>
                      <td className="py-4 text-slate-900 font-black">
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
                          className="text-rose-500 hover:font-black"
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

          {/* [기타 탭들 요약] */}
          {["일별수익률", "보유종목일별", "월별수익률"].includes(activeTab) && (
            <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">
              {activeTab} 데이터 분석 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
