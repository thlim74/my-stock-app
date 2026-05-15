"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("보유현황");
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // [데이터] 종목마스터 (이미지 기반 확장)
  const [masterList, setMasterList] = useState([
    { ticker: "KRX:005930", name: "삼성전자", currency: "KRW" },
    { ticker: "KRX:000660", name: "SK하이닉스", currency: "KRW" },
    { ticker: "KRX:091230", name: "tiger 반도체", currency: "KRW" },
    { ticker: "KRX:226490", name: "kodex 코스피", currency: "KRW" },
  ]);

  // [데이터] 거래내역 (계산을 위한 샘플 데이터)
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-05-14",
      type: "매수",
      ticker: "KRX:005930",
      name: "삼성전자",
      quantity: 120,
      price: 154822,
      amount: 18578640,
    },
    {
      id: 2,
      date: "2026-05-14",
      type: "매수",
      ticker: "KRX:000660",
      name: "SK하이닉스",
      quantity: 15,
      price: 1979667,
      amount: 29695005,
    },
    {
      id: 3,
      date: "2026-05-14",
      type: "매수",
      ticker: "KRX:091230",
      name: "tiger 반도체",
      quantity: 128,
      price: 102835,
      amount: 13162880,
    },
    {
      id: 4,
      date: "2026-05-14",
      type: "매수",
      ticker: "KRX:226490",
      name: "kodex 코스피",
      quantity: 150,
      price: 43496,
      amount: 6524400,
    },
  ]);

  // [데이터] 가격 정보 (실제 구현 시 API 연동 대상)
  const [priceData, setPriceData] = useState({
    "KRX:005930": { current: 274000, yesterday: 296000 },
    "KRX:000660": { current: 1841000, yesterday: 1970000 },
    "KRX:091230": { current: 153870, yesterday: 165410 },
    "KRX:226490": { current: 77600, yesterday: 81600 },
  });

  // --- [계산 로직] 보유현황 데이터 생성 ---
  const getHoldings = () => {
    const holdingsMap = {};

    transactions.forEach((t) => {
      if (!holdingsMap[t.ticker]) {
        holdingsMap[t.ticker] = {
          ticker: t.ticker,
          name: t.name,
          quantity: 0,
          totalCost: 0,
        };
      }
      if (t.type === "매수") {
        holdingsMap[t.ticker].quantity += t.quantity;
        holdingsMap[t.ticker].totalCost += t.amount;
      } else {
        holdingsMap[t.ticker].quantity -= t.quantity;
        holdingsMap[t.ticker].totalCost -=
          (holdingsMap[t.ticker].totalCost / holdingsMap[t.ticker].quantity) *
          t.quantity;
      }
    });

    return Object.values(holdingsMap)
      .filter((h) => h.quantity > 0)
      .map((h) => {
        const currentPrice = priceData[h.ticker]?.current || 0;
        const yesterdayPrice = priceData[h.ticker]?.yesterday || 0;
        const avgPrice = h.totalCost / h.quantity;
        const evaluationAmount = h.quantity * currentPrice;
        const profit = evaluationAmount - h.totalCost;
        const profitRate = (profit / h.totalCost) * 100;

        // 일수익 계산: (현재가 - 전일종가) * 보유수량
        const dailyProfit = (currentPrice - yesterdayPrice) * h.quantity;
        const dailyRate =
          ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;

        return {
          ...h,
          avgPrice,
          currentPrice,
          evaluationAmount,
          profit,
          profitRate,
          dailyProfit,
          dailyRate,
        };
      });
  };

  const holdings = getHoldings();
  const totalEval = holdings.reduce(
    (acc, cur) => acc + cur.evaluationAmount,
    0,
  );
  const totalCost = holdings.reduce((acc, cur) => acc + cur.totalCost, 0);
  const totalProfit = totalEval - totalCost;
  const totalProfitRate = (totalProfit / totalCost) * 100;

  // 탭 메뉴
  const menuItems = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "거래입력",
    "거래내역",
    "종목마스터",
    "일별종가",
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 text-slate-900 font-sans">
      {/* 상단 요약 바 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-800">
          My Portfolio
        </h1>
        <div className="flex gap-2">
          <button className="rounded-lg bg-white px-4 py-2 text-[11px] font-bold shadow-sm border border-slate-200">
            지수 새로고침
          </button>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-[11px] font-bold text-white shadow-sm">
            로그아웃
          </button>
        </div>
      </div>

      {/* 자산 요약 카드 (이미지 스타일) */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: "순투자원금", value: totalCost.toLocaleString() },
          { label: "평가금액", value: totalEval.toLocaleString() },
          { label: "현금보유", value: "78,158" },
          {
            label: "총자산(현금포함)",
            value: (totalEval + 78158).toLocaleString(),
          },
          {
            label: "평가손익",
            value: totalProfit.toLocaleString(),
            color: totalProfit >= 0 ? "text-emerald-500" : "text-rose-500",
          },
          {
            label: "전체 수익률",
            value: totalProfitRate.toFixed(2) + "%",
            color: totalProfit >= 0 ? "text-emerald-500" : "text-rose-500",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-4 shadow-sm border border-slate-100 text-center"
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

      {/* 메인 컨테이너 */}
      <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* 탭 메뉴 */}
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

        <div className="p-0">
          {activeTab === "보유현황" && (
            <div className="animate-in fade-in duration-500">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">
                  최신종가 기준시각: 2026. 05. 15. 오후 2:09:55
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-tighter border-b border-slate-200">
                      <th className="py-3 px-4">티커</th>
                      <th className="py-3">종목명</th>
                      <th className="py-3 text-center">통화</th>
                      <th className="py-3 text-center">보유수량</th>
                      <th className="py-3 text-right">순투자원금</th>
                      <th className="py-3 text-right">평균단가</th>
                      <th className="py-3 text-right">최신종가</th>
                      <th className="py-3 text-right">평가금액</th>
                      <th className="py-3 text-right">평가손익</th>
                      <th className="py-3 text-right">수익률</th>
                      <th className="py-3 text-right">일수익금</th>
                      <th className="py-3 text-right px-4">일수익률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {holdings.map((h, i) => (
                      <tr
                        key={i}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="py-4 px-4 font-medium text-slate-400">
                          {h.ticker}
                        </td>
                        <td className="py-4 font-bold text-slate-700">
                          {h.name}
                        </td>
                        <td className="py-4 text-center text-slate-500">KRW</td>
                        <td className="py-4 text-center font-bold">
                          {h.quantity}
                        </td>
                        <td className="py-4 text-right font-semibold">
                          {h.totalCost.toLocaleString()}
                        </td>
                        <td className="py-4 text-right text-slate-500">
                          {Math.round(h.avgPrice).toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-bold text-blue-600">
                          {h.currentPrice.toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-black text-slate-800">
                          {h.evaluationAmount.toLocaleString()}
                        </td>
                        <td
                          className={`py-4 text-right font-bold ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.profit >= 0 ? "+" : ""}
                          {h.profit.toLocaleString()}
                        </td>
                        <td
                          className={`py-4 text-right font-bold ${h.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.profitRate.toFixed(2)}%
                        </td>
                        <td
                          className={`py-4 text-right font-bold ${h.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.dailyProfit.toLocaleString()}
                        </td>
                        <td
                          className={`py-4 text-right px-4 font-bold ${h.dailyRate >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {h.dailyRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab !== "보유현황" && (
            <div className="py-20 text-center text-slate-300 font-bold text-sm">
              {activeTab} 기능 구현 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
