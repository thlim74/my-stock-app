"use client";

import React, { useState, useMemo } from "react";

export default function IntegratedPortfolioManagementSystem() {
  const [activeTab, setActiveTab] = useState("보유현황");

  // --- [1. 마스터 데이터 및 초기 상태] ---
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

  // 이미지 6번의 리스트 형태를 반영한 일별 종가 데이터
  const [priceHistory] = useState([
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

  const [cashFlows] = useState([
    { date: "2026-05-14", type: "출금", amount: 30992280, memo: "계좌이체" },
    { date: "2026-05-12", type: "출금", amount: 3341518, memo: "카드결제" },
    { date: "2026-05-08", type: "입금", amount: 26815659, memo: "급여" },
    { date: "2026-05-04", type: "입금", amount: 7487976, memo: "입금" },
  ]);

  const [holdingsData] = useState([
    {
      ticker: "KRX:000660",
      name: "SK하이닉스",
      qty: 15,
      avgPrice: 1979667,
      buyAmt: 29695000,
    },
    {
      ticker: "KRX:005930",
      name: "삼성전자",
      qty: 120,
      avgPrice: 154822,
      buyAmt: 18578580,
    },
    {
      ticker: "KRX:091230",
      name: "tiger 반도체",
      qty: 128,
      avgPrice: 102835,
      buyAmt: 13162869,
    },
    {
      ticker: "KRX:226490",
      name: "kodex 코스피",
      qty: 150,
      avgPrice: 43496,
      buyAmt: 6524345,
    },
  ]);

  // --- [2. 핵심 계산 로직] ---
  const summary = useMemo(() => {
    const netInv = 45137473;

    const holdings = holdingsData.map((h) => {
      const cur =
        priceHistory.find(
          (p) => p.ticker === h.ticker && p.date === "2026-05-15",
        )?.price || 0;
      const pre =
        priceHistory.find(
          (p) => p.ticker === h.ticker && p.date === "2026-05-14",
        )?.price || cur;
      const evalAmt = h.qty * cur;
      const profit = evalAmt - h.buyAmt;
      const dailyProfit = (cur - pre) * h.qty;
      return {
        ...h,
        cur,
        evalAmt,
        profit,
        rate: (profit / h.buyAmt) * 100,
        dailyProfit,
        dailyRate: pre !== 0 ? ((cur - pre) / pre) * 100 : 0,
      };
    });

    const totalEval = holdings.reduce((a, b) => a + b.evalAmt, 0);
    return { netInv, totalEval, totalAsset: totalEval + 78158, holdings };
  }, [holdingsData, priceHistory]);

  // --- [3. UI 레이아웃] ---
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
      {/* 타이틀 및 지수 보드 */}
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
          {["코스피 752,817 (-5.68%)", "코스닥 112,848 (-5.26%)"].map(
            (idx, i) => (
              <div
                key={i}
                className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-[11px] font-black italic"
              >
                {idx}
              </div>
            ),
          )}
        </div>
      </div>

      {/* 대시보드 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "순투자원금", value: summary.netInv.toLocaleString() },
          { label: "총자산", value: summary.totalAsset.toLocaleString() },
          { label: "평가금액", value: summary.totalEval.toLocaleString() },
          { label: "현금", value: "78,158" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {card.label}
            </p>
            <p className="text-2xl font-black text-slate-900">
              {card.value}{" "}
              <span className="text-sm font-bold text-slate-300">원</span>
            </p>
          </div>
        ))}
      </div>

      {/* 메인 탭 컨테이너 */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="flex bg-slate-50/50 p-2 overflow-x-auto border-b border-slate-100 scrollbar-hide">
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
          {/* 탭 1: 보유현황 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                최신종가 기준시각: 2026. 5. 15. 오후 2:09:55 | 실시간 수집중
              </p>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 border-b">
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
                  {summary.holdings.map((h, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 text-slate-400">{h.ticker}</td>
                      <td className="py-5 font-black text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-5 text-right">{h.qty}</td>
                      <td className="py-5 text-right text-slate-400">
                        {h.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-5 text-right text-blue-600 font-black">
                        {h.cur.toLocaleString()}
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

          {/* 탭 2: 일별수익률 */}
          {activeTab === "일별수익률" && (
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead className="text-slate-400 border-b">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th>기준</th>
                    <th className="pb-4 text-right">평가금액</th>
                    <th className="pb-4 text-right">당일 현금흐름</th>
                    <th className="pb-4 text-right">일간 손익</th>
                    <th className="pb-4 text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-4 px-4 font-bold">2026-05-15</td>
                    <td>실시간</td>
                    <td className="text-right font-black">91,912,370</td>
                    <td className="text-right">0</td>
                    <td className="text-right text-rose-500 font-bold">
                      -6,570,110
                    </td>
                    <td className="text-right px-4 text-emerald-500 font-bold">
                      46,845,139.38
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold">2026-05-14</td>
                    <td>종가</td>
                    <td className="text-right font-black">98,482,480</td>
                    <td className="text-right">-30,992,280</td>
                    <td className="text-right text-emerald-500 font-bold">
                      1,569,250
                    </td>
                    <td className="text-right px-4 text-emerald-500 font-bold">
                      53,415,249.38
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 3: 보유종목일별 */}
          {activeTab === "보유종목일별" && (
            <div className="overflow-x-auto text-[11px]">
              <div className="flex gap-2 mb-6">
                <input
                  type="date"
                  className="border p-2 rounded-lg"
                  defaultValue="2026-05-07"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                  기간 조회
                </button>
              </div>
              <table className="w-full text-left font-bold">
                <thead className="bg-slate-50 text-slate-500 border-y">
                  <tr>
                    <th className="p-4">종목명</th>
                    <th className="text-right">2026-05-15</th>
                    <th className="text-right">2026-05-14</th>
                    <th className="text-right p-4">2026-05-13</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/50">
                    <td className="p-4 font-black">일별 수익 합계</td>
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
                  {summary.holdings.map((h, i) => (
                    <tr key={i}>
                      <td className="p-4 text-slate-500">{h.name}</td>
                      <td className="text-right text-rose-500">
                        {h.dailyProfit.toLocaleString()} (
                        {h.dailyRate.toFixed(2)}%)
                      </td>
                      <td className="text-right text-emerald-500">0 (0.00%)</td>
                      <td className="text-right p-4 text-emerald-500">
                        0 (0.00%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 4: 월별수익률 */}
          {activeTab === "월별수익률" && (
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left font-bold border-collapse">
                <thead className="text-slate-400 border-b">
                  <tr>
                    <th className="pb-4 px-4">월</th>
                    <th>월초평가액</th>
                    <th>월말평가액</th>
                    <th className="pb-4 text-right">월간 수익률</th>
                    <th className="pb-4 text-right px-4">평가손익</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-black">
                  <tr>
                    <td className="py-5 px-4 font-bold text-slate-500">
                      2026-05
                    </td>
                    <td>77,986,020</td>
                    <td>91,880,010</td>
                    <td className="text-right text-emerald-500">17.78%</td>
                    <td className="text-right px-4 text-emerald-500">
                      46,812,779.38
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 px-4 font-bold text-slate-500">
                      2026-04
                    </td>
                    <td>55,040,000</td>
                    <td>77,986,020</td>
                    <td className="text-right text-emerald-500">41.64%</td>
                    <td className="text-right px-4 text-emerald-500">
                      32,948,952.38
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 5: 입출금 */}
          {activeTab === "입출금" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
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
                    <tr key={i} className="font-bold">
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

          {/* 탭 6: 거래관리 */}
          {activeTab === "거래관리" && (
            <div>
              <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-100 mb-8 grid grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Type
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>매수 (Buy)</option>
                    <option>매도 (Sell)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Asset
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    <option>종목 선택</option>
                    {masterStocks.map((s) => (
                      <option key={s.ticker}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-tighter">
                    Qty
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-[#1e293b] text-white p-3.5 rounded-xl font-black text-xs shadow-xl">
                  거래 저장
                </button>
              </div>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-300 border-b">
                  <tr>
                    <th className="pb-4">DATE</th>
                    <th className="pb-4">TYPE</th>
                    <th className="pb-4">ASSET</th>
                    <th className="pb-4 text-right">QTY</th>
                    <th className="pb-4 text-right px-4">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-5 text-slate-400">2026-05-10</td>
                    <td>
                      <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                        매수
                      </span>
                    </td>
                    <td className="font-black text-slate-900">
                      삼성전자{" "}
                      <span className="text-slate-300 ml-1">005930</span>
                    </td>
                    <td className="text-right">10</td>
                    <td className="text-right px-4">720,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 탭 7: 종목마스터 */}
          {activeTab === "종목마스터" && (
            <div className="overflow-x-auto text-[11px] font-bold">
              <table className="w-full text-left border-collapse">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th>티커</th>
                    <th>종목명</th>
                    <th>통화</th>
                    <th>상장시장</th>
                    <th className="text-right px-6">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterStocks.map((s, i) => (
                    <tr key={i}>
                      <td className="py-4 text-slate-400">{s.ticker}</td>
                      <td className="font-black text-slate-900">{s.name}</td>
                      <td>{s.currency}</td>
                      <td>{s.market}</td>
                      <td className="text-right px-6">
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

          {/* 탭 8: 일별종가 (이미지 6번 완벽 구현) */}
          {activeTab === "일별종가" && (
            <div>
              <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 mb-8 grid grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Base Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    defaultValue="2026-05-15"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Asset
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
                  <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                    placeholder="0"
                  />
                </div>
                <button className="bg-blue-600 text-white p-3.5 rounded-xl font-black text-xs shadow-lg shadow-blue-100">
                  종가 저장
                </button>
              </div>
              <div className="flex gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6 text-[11px] font-black text-blue-800">
                <span>🇰🇷 한국 최종수집: 2026-05-15 14:09:55</span>
                <span className="text-blue-300">|</span>
                <span>🇺🇸 미국 최종수집: 2026-05-15 08:00:02</span>
              </div>
              <table className="w-full text-left text-[11px] font-bold">
                <thead className="text-slate-400 border-b uppercase">
                  <tr>
                    <th className="pb-4 px-4">기준일</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th className="text-right">종가</th>
                    <th className="text-right px-6">수집시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {priceHistory.map((p, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-400">{p.date}</td>
                      <td className="text-slate-500">{p.ticker}</td>
                      <td className="font-black text-slate-900">{p.name}</td>
                      <td className="text-right text-blue-600 font-black">
                        {p.price.toLocaleString()}
                      </td>
                      <td className="text-right px-6 text-slate-400">
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
