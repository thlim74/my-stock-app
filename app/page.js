"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PlusCircle, Trash2 } from "lucide-react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");

  const fetchStocks = async () => {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.log("error", error);
    else setStocks(data);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const addStock = async () => {
    if (!name || !quantity || !buyPrice || !currentPrice)
      return alert("모든 항목을 입력해주세요!");
    const { error } = await supabase.from("stocks").insert([
      {
        name,
        quantity: parseInt(quantity),
        avg_price: parseInt(buyPrice),
        current_price: parseInt(currentPrice),
      },
    ]);
    if (error) alert("저장 실패: " + error.message);
    else {
      setName("");
      setQuantity("");
      setBuyPrice("");
      setCurrentPrice("");
      fetchStocks();
    }
  };

  const deleteStock = async (id) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await supabase.from("stocks").delete().eq("id", id);
      fetchStocks();
    }
  };

  const totalInvested = stocks.reduce(
    (acc, s) => acc + s.avg_price * s.quantity,
    0,
  );
  const totalValue = stocks.reduce(
    (acc, s) => acc + s.current_price * s.quantity,
    0,
  );
  const totalProfit = totalValue - totalInvested;
  const totalRate =
    totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : 0;

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">MY PORTFOLIO</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-1">총 투자금액</p>
            <p className="text-2xl font-black">
              {totalInvested.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-1">평가손익</p>
            <p
              className={`text-2xl font-black ${totalProfit >= 0 ? "text-blue-600" : "text-red-500"}`}
            >
              {totalProfit.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-1">수익률</p>
            <p
              className={`text-2xl font-black ${totalProfit >= 0 ? "text-blue-600" : "text-red-500"}`}
            >
              {totalRate}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md mb-10 flex flex-wrap gap-4 items-end">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="종목명"
            className="bg-slate-50 p-2 rounded-lg outline-none"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            placeholder="수량"
            className="bg-slate-50 p-2 rounded-lg outline-none"
          />
          <input
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            type="number"
            placeholder="매수평단가"
            className="bg-slate-50 p-2 rounded-lg outline-none"
          />
          <input
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            type="number"
            placeholder="현재가"
            className="bg-slate-50 p-2 rounded-lg outline-none"
          />
          <button
            onClick={addStock}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold"
          >
            추가
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs">
              <tr>
                <th className="p-4">종목</th>
                <th className="p-4 text-right">비중</th>
                <th className="p-4 text-right">가격정보</th>
                <th className="p-4 text-right">수익률</th>
                <th className="p-4 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const profitRate = (
                  ((stock.current_price - stock.avg_price) / stock.avg_price) *
                  100
                ).toFixed(2);
                return (
                  <tr key={stock.id} className="border-t">
                    <td className="p-4 font-bold">{stock.name}</td>
                    <td className="p-4 text-right">
                      {totalInvested > 0
                        ? (
                            ((stock.avg_price * stock.quantity) /
                              totalInvested) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                    <td className="p-4 text-right text-sm">
                      <div>현재: {stock.current_price.toLocaleString()}원</div>
                      <div className="text-slate-400 text-xs">
                        평단: {stock.avg_price.toLocaleString()}원
                      </div>
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${profitRate >= 0 ? "text-blue-600" : "text-red-500"}`}
                    >
                      {profitRate}%
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteStock(stock.id)}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
