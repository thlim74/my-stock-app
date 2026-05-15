"use client";
import { useState, useEffect } from "react";

export default function PortfolioApp() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("보유현황");
  const [currentTime, setCurrentTime] = useState(new Date());

  // [데이터] 종목 마스터
  const [masterList] = useState([
    { ticker: "KRX:005930", name: "삼성전자", currency: "KRW" },
    { ticker: "KRX:000660", name: "SK하이닉스", currency: "KRW" },
    { ticker: "KRX:091230", name: "tiger 반도체", currency: "KRW" },
    { ticker: "KRX:226490", name: "kodex 코스피", currency: "KRW" },
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD" },
  ]);

  // [데이터] 입출금 내역
  const [cashTransactions] = useState([
    {
      id: 1,
      date: "2026-05-14",
      type: "출금",
      amount: 30992280,
      memo: "계좌 이체",
    },
    {
      id: 2,
      date: "2026-05-12",
      type: "출금",
      amount: 3341518,
      memo: "부분 출금",
    },
    {
      id: 3,
      date: "2026-05-08",
      type: "입금",
      amount: 26815659,
      memo: "추가 입금",
    },
    {
      id: 4,
      date: "2026-05-04",
      type: "입금",
      amount: 7487976,
      memo: "초기 자본",
    },
  ]);

  // [데이터] 거래 내역
  const [tradeHistory] = useState([
    {
      date: "2026-05-14",
      ticker: "KRX:005930",
      name: "삼성전자",
      type: "매수",
      quantity: 120,
      price: 154822,
      amount: 18578580,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      type: "매수",
      quantity: 15,
      price: 1979667,
      amount: 29695000,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:091230",
      name: "tiger 반도체",
      type: "매수",
      quantity: 128,
      price: 102835,
      amount: 13162869,
    },
    {
      date: "2026-05-14",
      ticker: "KRX:226490",
      name: "kodex 코스피",
      type: "매수",
      quantity: 150,
      price: 43496,
      amount: 6524345,
    },
  ]);

  // [데이터] 일별 종가 데이터 (수집 로직의 근간)
  const [dailyPrices, setDailyPrices] = useState([
    { date: "2026-05-15", ticker: "KRX:005930", price: 274000 },
    { date: "2026-05-15", ticker: "KRX:000660", price: 1841000 },
    { date: "2026-05-15", ticker: "KRX:091230", price: 153870 },
    { date: "2026-05-15", ticker: "KRX:226490", price: 77600 },
    { date: "2026-05-14", ticker: "KRX:005930", price: 296000 },
    { date: "2026-05-14", ticker: "KRX:000660", price: 1970000 },
  ]);

  // 2. 자동 수집 시간 감지 시뮬레이션 (KR 20:10 / US 08:00)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const h = now.getHours();
      const m = now.getMinutes();

      if (h === 20 && m === 10)
        console.log("한국 에프터마켓 종료 - 종가 수집 실행");
      if (h === 8 && m === 0) console.log("미국 시장 종료 - 종가 수집 실행");
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. 공통 계산 함수들
  const getNetInvestment = () =>
    cashTransactions
      .filter((t) => t.type === "입금")
      .reduce((a, c) => a + c.amount, 0) -
    cashTransactions
      .filter((t) => t.type === "출금")
      .reduce((a, c) => a + c.amount, 0);

  const getHoldingsData = () => {
    return tradeHistory.map((trade) => {
      const current =
        dailyPrices.find(
          (p) => p.ticker === trade.ticker && p.date === "2026-05-15",
        )?.price || trade.price;
      const yesterday =
        dailyPrices.find(
          (p) => p.ticker === trade.ticker && p.date === "2026-05-14",
        )?.price || trade.price;
      const evalAmt = trade.quantity * current;
      const profit = evalAmt - trade.amount;
      const dailyProfit = (current - yesterday) * trade.quantity;
      return {
        ...trade,
        current,
        evalAmt,
        profit,
        dailyProfit,
        dailyRate: ((current - yesterday) / yesterday) * 100,
      };
    });
  };

  const holdings = getHoldingsData();
  const totalEval = holdings.reduce((a, c) => a + c.evalAmt, 0);
  const netInv = getNetInvestment();

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
      {/* 상단 통합 대시보드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6 text-center">
        {[
          { label: "순투자원금", value: netInv.toLocaleString() },
          { label: "평가금액", value: totalEval.toLocaleString() },
          { label: "현금보유", value: "78,158" },
          {
            label: "총자산(현금포함)",
            value: (totalEval + 78158).toLocaleString(),
          },
          {
            label: "평가손익",
            value: (totalEval - netInv).toLocaleString(),
            color: "text-emerald-500",
          },
          {
            label: "전체 수익률",
            value: (((totalEval - netInv) / netInv) * 100).toFixed(2) + "%",
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

      {/* 탭 메뉴 */}
      <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 overflow-x-auto scrollbar-hide">
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

        <div className="p-0">
          {/* 1. 보유현황 */}
          {activeTab === "보유현황" && (
            <div className="overflow-x-auto">
              <div className="p-4 bg-slate-50 text-[10px] text-slate-400 border-b border-slate-100">
                기준시각: 2026. 05. 15. 오후 2:09:55 | 수집조건: KR 20:10 / US
                08:00 자동
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-4 px-6">종목명</th>
                    <th className="py-4 text-center">보유수량</th>
                    <th className="py-4 text-right">평균단가</th>
                    <th className="py-4 text-right">최신종가</th>
                    <th className="py-4 text-right">평가금액</th>
                    <th className="py-4 text-right">수익률</th>
                    <th className="py-4 text-right px-6">일수익금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 font-medium">
                      <td className="py-4 px-6 font-bold">{h.name}</td>
                      <td className="py-4 text-center">{h.quantity}</td>
                      <td className="py-4 text-right text-slate-500">
                        {h.price.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-bold text-blue-600">
                        {h.current.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-black">
                        {h.evalAmt.toLocaleString()}
                      </td>
                      <td
                        className={`py-4 text-right font-bold ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {((h.profit / h.amount) * 100).toFixed(2)}%
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

          {/* 2. 일별수익률 */}
          {activeTab === "일별수익률" && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">기준일</th>
                  <th className="py-4 text-right">평가금액</th>
                  <th className="py-4 text-right">일간 손익</th>
                  <th className="py-4 text-right px-6">일간 수익률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="py-4 px-6">2026-05-15</td>
                  <td className="py-4 text-right font-bold">91,912,370</td>
                  <td className="py-4 text-right text-rose-500 font-bold">
                    -6,570,110
                  </td>
                  <td className="py-4 text-right px-6 text-rose-500 font-bold">
                    -6.67%
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-4 px-6">2026-05-14</td>
                  <td className="py-4 text-right font-bold">98,482,480</td>
                  <td className="py-4 text-right text-emerald-500 font-bold">
                    +1,569,250
                  </td>
                  <td className="py-4 text-right px-6 text-emerald-500 font-bold">
                    +2.38%
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* 3. 보유종목일별 (피벗 스타일) */}
          {activeTab === "보유종목일별" && (
            <div className="overflow-x-auto p-4">
              <p className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-widest">
                Daily Performance by Ticker
              </p>
              <table className="w-full text-[11px] border-collapse min-w-[800px]">
                <thead className="bg-slate-50 text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-left border-b">종목명</th>
                    <th className="py-3 text-right border-b">2026-05-15</th>
                    <th className="py-3 text-right border-b">2026-05-14</th>
                    <th className="py-3 text-right border-b">2026-05-13</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holdings.map((h, i) => (
                    <tr key={i}>
                      <td className="py-4 px-4 font-bold">{h.name}</td>
                      <td className="py-4 text-right text-rose-500 font-bold">
                        -6.50%
                      </td>
                      <td className="py-4 text-right text-emerald-500 font-bold">
                        +1.20%
                      </td>
                      <td className="py-4 text-right text-slate-400">0.00%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. 입출금 */}
          {activeTab === "입출금" && (
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="date"
                  className="bg-white p-2 rounded border text-xs"
                />
                <select className="bg-white p-2 rounded border text-xs">
                  <option>입금</option>
                  <option>출금</option>
                </select>
                <input
                  type="number"
                  placeholder="금액"
                  className="bg-white p-2 rounded border text-xs"
                />
                <button className="bg-slate-800 text-white rounded text-xs font-bold">
                  등록
                </button>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 uppercase text-[10px] border-b">
                  <tr>
                    <th className="pb-2">날짜</th>
                    <th className="pb-2">구분</th>
                    <th className="pb-2 text-right px-6">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {cashTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50">
                      <td className="py-3">{t.date}</td>
                      <td>{t.type}</td>
                      <td
                        className={`py-3 text-right px-6 font-bold ${t.type === "입금" ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. 일별종가 (보유종목 한정 수집) */}
          {activeTab === "일별종가" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase text-slate-400">
                  보유종목 종가 관리
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                  수집 기준: KR 20:10 / US 08:00
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <select className="border p-2 rounded text-xs font-bold">
                  {masterList.map((s) => (
                    <option key={s.ticker}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="border p-2 rounded text-xs"
                  defaultValue="2026-05-15"
                />
                <input
                  type="number"
                  placeholder="종가 입력"
                  className="border p-2 rounded text-xs"
                />
                <button className="bg-blue-600 text-white rounded text-xs font-black">
                  수동 등록
                </button>
              </div>
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="py-2 px-4 text-left">날짜</th>
                    <th className="py-2 text-left">종목</th>
                    <th className="py-2 text-right px-4">가격</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyPrices.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4">{p.date}</td>
                      <td>{p.ticker}</td>
                      <td className="py-3 text-right px-4 font-bold text-blue-600">
                        {p.price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. 월별수익률 (간략 구현) */}
          {activeTab === "월별수익률" && (
            <div className="p-10 text-center text-slate-300 font-bold">
              월별 성적표 데이터를 불러오는 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
