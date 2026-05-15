"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState("거래관리"); // 테스트를 위해 기본탭을 거래관리로 설정
  const [indices, setIndices] = useState([]);

  // --- 데이터 상태 ---
  const [masterList, setMasterList] = useState([
    { ticker: "005930", name: "삼성전자", currency: "KRW" },
    { ticker: "000660", name: "SK하이닉스", currency: "KRW" },
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD" },
  ]);

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-05-10",
      type: "매수",
      ticker: "005930",
      name: "삼성전자",
      quantity: 10,
      price: 72000,
      amount: 720000,
    },
  ]);

  // --- 거래 입력 폼 상태 ---
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "매수",
    ticker: "",
    quantity: "",
    price: "",
  });

  const menuItems = [
    "보유현황",
    "일별수익률",
    "보유종목일별",
    "월별수익률",
    "입출금",
    "거래관리",
    "종목마스터",
    "일별종가",
  ];

  // --- 거래 저장 함수 ---
  const handleAddTransaction = () => {
    const { date, type, ticker, quantity, price } = formData;
    if (!ticker || !quantity || !price)
      return alert("모든 항목을 입력해주세요.");

    const selectedAsset = masterList.find((item) => item.ticker === ticker);
    const newTransaction = {
      id: Date.now(),
      date,
      type,
      ticker,
      name: selectedAsset.name,
      quantity: Number(quantity),
      price: Number(price),
      amount: Number(quantity) * Number(price),
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({ ...formData, ticker: "", quantity: "", price: "" }); // 폼 초기화
  };

  // --- 거래 삭제 함수 ---
  const handleDeleteTransaction = (id) => {
    if (confirm("이 거래 기록을 삭제하시겠습니까?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
      {/* (헤더, 지수보드, 자산현황 섹션은 이전과 동일하므로 생략 - 구조 유지 필요) */}

      <div className="rounded-[2.5rem] bg-white shadow-2xl border border-slate-100 overflow-hidden mt-8">
        <div className="flex border-b border-slate-50 bg-slate-50/50 p-2 overflow-x-auto scrollbar-hide">
          {menuItems.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-[11px] font-black transition-all ${activeTab === tab ? "bg-slate-800 text-white rounded-2xl shadow-lg transform scale-105" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === "거래관리" && (
            <div className="animate-in fade-in duration-500">
              {/* 1. 거래 입력 섹션 */}
              <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
                  New Transaction
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    >
                      <option value="매수">매수 (Buy)</option>
                      <option value="매도">매도 (Sell)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Select Asset
                    </label>
                    <select
                      value={formData.ticker}
                      onChange={(e) =>
                        setFormData({ ...formData, ticker: e.target.value })
                      }
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    >
                      <option value="">종목 선택</option>
                      {masterList.map((item) => (
                        <option key={item.ticker} value={item.ticker}>
                          {item.name} ({item.ticker})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="0"
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0"
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    />
                  </div>
                  <button
                    onClick={handleAddTransaction}
                    className="bg-slate-800 text-white rounded-xl font-black text-xs py-3.5 shadow-lg hover:bg-black transition-all"
                  >
                    거래 저장
                  </button>
                </div>
              </div>

              {/* 2. 거래 내역 리스트 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50 uppercase tracking-tighter">
                      <th className="pb-4 px-4">Date</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4">Asset</th>
                      <th className="pb-4 text-right">Qty</th>
                      <th className="pb-4 text-right">Price</th>
                      <th className="pb-4 text-right">Total Amount</th>
                      <th className="pb-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-[11px] font-bold text-slate-400">
                          {t.date}
                        </td>
                        <td className="py-4">
                          <span
                            className={`text-[10px] font-black px-2 py-1 rounded ${t.type === "매수" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-4 font-black text-slate-800">
                          {t.name}{" "}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold">
                          {t.quantity.toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-bold text-slate-500">
                          {t.price.toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-black text-slate-800">
                          {t.amount.toLocaleString()}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 다른 탭들 안내 메시지... */}
          {activeTab !== "거래관리" && (
            <div className="text-center py-20 text-slate-300 font-bold text-sm">
              {activeTab} 탭을 구현해 주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
