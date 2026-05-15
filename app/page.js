"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PlusCircle, Trash2, RefreshCw } from "lucide-react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);

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

  // 실시간 가격을 가져오는 함수 (가상의 API 연결 로직 포함)
  const getLivePrice = async (stockNameOrCode) => {
    try {
      // 실제 구현 시에는 별도의 API Route를 만들어야 하지만,
      // 테스트를 위해 입력값이 있을 때 랜덤 가격을 생성하거나
      // 이후 외부 API 연동을 위한 브릿지 역할을 합니다.
      const mockPrice = Math.floor(Math.random() * 100000) + 1000;
      return mockPrice;
    } catch (e) {
      return 0;
    }
  };

  const addStock = async () => {
    if (!name || !quantity || !buyPrice)
      return alert("종목명, 수량, 매수평단가를 입력해주세요!");

    setLoading(true);

    // 현재가를 자동으로 조회 (여기에 실제 API 연동이 들어갑니다)
    const livePrice = await getLivePrice(name);

    const { error } = await supabase.from("stocks").insert([
      {
        name,
        quantity: parseInt(quantity),
        avg_price: parseInt(buyPrice),
        current_price: livePrice, // 자동 조회된 가격 저장
        code: name, // 입력한 종목명/코드를 저장
      },
    ]);

    setLoading(false);

    if (error) alert("저장 실패: " + error.message);
    else {
      setName("");
      setQuantity("");
      setBuyPrice("");
      fetchStocks();
    }
  };

  const deleteStock = async (id) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await supabase.from("stocks").delete().eq("id", id);
      fetchStocks();
    }
  };

  // 모든 종목 가격 새로고침
  const refreshPrices = async () => {
    setLoading(true);
    for (const stock of stocks) {
      const newPrice = await getLivePrice(stock.name);
      await supabase
        .from("stocks")
        .update({ current_price: newPrice })
        .eq("id", stock.id);
    }
    await fetchStocks();
    setLoading(false);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">MY PORTFOLIO</h1>
          <button
            onClick={refreshPrices}
            className={`flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-xl border shadow-sm hover:bg-slate-50 ${loading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} />
            가격 갱신
          </button>
        </div>

        {/* 상단 대시보드 카드 */}
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
              {totalProfit >= 0 ? "+" : ""}
              {totalProfit.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-1">수익률</p>
            <p
              className={`text-2xl font-black ${totalProfit >= 0 ? "text-blue-600" : "text-red-500"}`}
            >
              {totalProfit >= 0 ? "+" : ""}
              {totalRate}%
            </p>
          </div>
        </div>

        {/* 입력 창 */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-10 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-slate-400 mb-2">
              종목명 또는 코드
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 삼성전자 또는 005930"
              className="w-full bg-slate-50 p-2.5 rounded-lg outline-none border border-transparent focus:border-slate-200"
            />
          </div>
          <div className="w-32">
            <p className="text-xs font-bold text-slate-400 mb-2">수량</p>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              placeholder="0"
              className="w-full bg-slate-50 p-2.5 rounded-lg outline-none border border-transparent focus:border-slate-200"
            />
          </div>
          <div className="w-40">
            <p className="text-xs font-bold text-slate-400 mb-2">매수평단가</p>
            <input
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              type="number"
              placeholder="0"
              className="w-full bg-slate-50 p-2.5 rounded-lg outline-none border border-transparent focus:border-slate-200"
            />
          </div>
          <button
            onClick={addStock}
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
          >
            {loading ? "조회 중..." : "추가"}
          </button>
        </div>

        {/* 테이블 목록 */}
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
                  <tr
                    key={stock.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
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
                      <div className="font-bold">
                        {stock.current_price.toLocaleString()}원
                      </div>
                      <div className="text-slate-400 text-xs">
                        평단: {stock.avg_price.toLocaleString()}원
                      </div>
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${profitRate >= 0 ? "text-blue-600" : "text-red-500"}`}
                    >
                      {profitRate >= 0 ? "+" : ""}
                      {profitRate}%
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteStock(stock.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
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
