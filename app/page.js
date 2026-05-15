"use client";
import { useState, useEffect } from "react";

export default function PortfolioDashboard() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState("거래관리"); // 현재 작업 중인 탭
  const [indices, setIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // --- [데이터] 종목마스터 상태 ---
  const [masterList, setMasterList] = useState([
    { ticker: "005930", name: "삼성전자", currency: "KRW" },
    { ticker: "000660", name: "SK하이닉스", currency: "KRW" },
    { ticker: "AAPL", name: "Apple Inc.", currency: "USD" },
  ]);

  // --- [데이터] 거래내역 상태 ---
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

  // --- [입력 폼] 종목마스터용 ---
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState("KRW");
  const [isSearching, setIsSearching] = useState(false);

  // --- [입력 폼] 거래관리용 ---
  const [tradeForm, setTradeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "매수",
    ticker: "",
    quantity: "",
    price: "",
  });

  // 8개 메뉴 설정
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

  // 지수 데이터 로딩
  const fetchIndices = async () => {
    setLoadingIndices(true);
    try {
      const res = await fetch("/api/indices");
      const data = await res.json();
      if (Array.isArray(data)) setIndices(data);
    } catch (e) {
      console.error("지수 로딩 실패");
    } finally {
      setLoadingIndices(false);
    }
  };

  // [기능] 종목마스터: 자동 찾기
  const handleAutoFind = async () => {
    if (!newTicker) return alert("티커를 입력하세요.");
    setIsSearching(true);
    try {
      const res = await fetch(`/api/master/search?code=${newTicker}`);
      const data = await res.json();
      if (data.name) setNewName(data.name);
      else alert("종목을 찾을 수 없습니다.");
    } catch (e) {
      alert("조회 중 오류 발생");
    } finally {
      setIsSearching(false);
    }
  };

  // [기능] 종목마스터: 추가
  const handleAddMaster = () => {
    if (!newTicker || !newName) return alert("정보를 입력하세요.");
    setMasterList([
      ...masterList,
      { ticker: newTicker, name: newName, currency: newCurrency },
    ]);
    setNewTicker("");
    setNewName("");
  };

  // [기능] 거래관리: 저장
  const handleAddTransaction = () => {
    const { date, type, ticker, quantity, price } = tradeForm;
    if (!ticker || !quantity || !price)
      return alert("모든 항목을 입력해주세요.");

    const selectedAsset = masterList.find((item) => item.ticker === ticker);
    const newTrade = {
      id: Date.now(),
      date,
      type,
      ticker,
      name: selectedAsset.name,
      quantity: Number(quantity),
      price: Number(price),
      amount: Number(quantity) * Number(price),
    };

    setTransactions([newTrade, ...transactions]);
    setTradeForm({ ...tradeForm, ticker: "", quantity: "", price: "" });
  };

  useEffect(() => {
    fetchIndices();
    const timer = setInterval(fetchIndices, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
      {/* 1. 상단 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
            My Portfolio
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
            Asset Management System
          </p>
        </div>
        <button
          onClick={fetchIndices}
          className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
        >
          지수 새로고침
        </button>
      </div>

      {/* 2. 실시간 주가지수 보드 */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {loadingIndices && indices.length === 0
          ? Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse bg-slate-200 rounded-2xl"
                />
              ))
          : indices.map((idx, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md"
              >
                <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                  {idx.name}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-black text-slate-800 tracking-tighter">
                    {idx.value}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${idx.isUp ? "text-rose-500" : "text-blue-500"}`}
                  >
                    {idx.rate}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* 3. 자산현황 요약 카드 (복원 완료) */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "순투자원금", value: "45,137,473" },
          { label: "총자산", value: "97,605,788" },
          { label: "평가금액", value: "97,527,630" },
          { label: "현금", value: "78,158" },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
              {item.label}
            </p>
            <p className="text-xl font-black text-slate-800">
              {item.value}
              <span className="ml-1 text-xs font-medium text-slate-400">
                원
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 4. 메인 탭 영역 */}
      <div className="rounded-[2.5rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-50 bg-slate-50/50 p-2 overflow-x-auto scrollbar-hide">
          {menuItems.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-[11px] font-black transition-all ${
                activeTab === tab
                  ? "bg-slate-800 text-white rounded-2xl shadow-lg transform scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* [거래관리 탭] */}
          {activeTab === "거래관리" && (
            <div className="animate-in fade-in duration-500">
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
                      value={tradeForm.date}
                      onChange={(e) =>
                        setTradeForm({ ...tradeForm, date: e.target.value })
                      }
                      className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                      Type
                    </label>
                    <select
                      value={tradeForm.type}
                      onChange={(e) =>
                        setTradeForm({ ...tradeForm, type: e.target.value })
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
                      value={tradeForm.ticker}
                      onChange={(e) =>
                        setTradeForm({ ...tradeForm, ticker: e.target.value })
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
                      value={tradeForm.quantity}
                      onChange={(e) =>
                        setTradeForm({ ...tradeForm, quantity: e.target.value })
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
                      value={tradeForm.price}
                      onChange={(e) =>
                        setTradeForm({ ...tradeForm, price: e.target.value })
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
                            onClick={() =>
                              setTransactions(
                                transactions.filter((tr) => tr.id !== t.id),
                              )
                            }
                            className="text-slate-300 hover:text-rose-500"
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

          {/* [종목마스터 탭] */}
          {activeTab === "종목마스터" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl items-end border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Ticker
                  </label>
                  <input
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    placeholder="005930"
                    className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Asset Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="종목명"
                      className="flex-1 bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                    />
                    <button
                      onClick={handleAutoFind}
                      disabled={isSearching}
                      className="bg-slate-200 px-4 rounded-xl text-[10px] font-black hover:bg-slate-300 transition-all"
                    >
                      {isSearching ? "조회중" : "자동찾기"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">
                    Currency
                  </label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200"
                  >
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <button
                  onClick={handleAddMaster}
                  className="bg-slate-800 text-white rounded-xl font-black text-xs py-3.5 shadow-lg"
                >
                  종목 추가
                </button>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-50 uppercase tracking-tighter">
                    <th className="pb-4 px-4">Ticker</th>
                    <th className="pb-4">Asset Name</th>
                    <th className="pb-4 text-center">Currency</th>
                    <th className="pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterList.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[11px]">
                        {item.ticker}
                      </td>
                      <td className="py-4 font-black text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                          {item.currency}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() =>
                            setMasterList(
                              masterList.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-slate-300 hover:text-rose-500"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 그 외 탭 */}
          {!["거래관리", "종목마스터"].includes(activeTab) && (
            <div className="text-center py-20 text-slate-300 font-bold text-sm">
              {activeTab} 탭의 내용을 구현 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
