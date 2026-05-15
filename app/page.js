"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PlusCircle, Trash2, RefreshCw } from "lucide-react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); // 종목코드 상태 추가
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. 데이터 불러오기
  const fetchStocks = async () => {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("데이터 로드 에러:", error);
    else setStocks(data || []);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // 2. 실시간 가격 가져오기 함수 (API Route 호출)
  const getLivePrice = async (stockCode) => {
    try {
      // 한국 종목 코드 형식 보정 (6자리 숫자인 경우 .KS 추가)
      const formattedCode =
        stockCode.length === 6 ? `${stockCode}.KS` : stockCode;
      const res = await fetch(`/api/price?code=${formattedCode}`);
      const data = await res.json();
      return data.price || 0;
    } catch (e) {
      console.error("가격 조회 실패:", e);
      return 0;
    }
  };

  // 3. 종목 추가
  const addStock = async () => {
    if (!name || !code || !quantity || !buyPrice) {
      return alert("종목명, 종목코드, 수량, 매수평단가를 모두 입력해주세요!");
    }

    setLoading(true);
    const livePrice = await getLivePrice(code);

    const { error } = await supabase.from("stocks").insert([
      {
        name,
        code,
        quantity: parseInt(quantity),
        avg_price: parseInt(buyPrice),
        current_price: livePrice || parseInt(buyPrice), // 가격 조회 실패 시 매수가로 대체
      },
    ]);

    setLoading(false);

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      setName("");
      setCode("");
      setQuantity("");
      setBuyPrice("");
      fetchStocks();
    }
  };

  // 4. 종목 삭제
  const deleteStock = async (id) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const { error } = await supabase.from("stocks").delete().eq("id", id);
      if (error) alert("삭제 실패");
      else fetchStocks();
    }
  };

  // 5. 전체 가격 새로고침
  const refreshPrices = async () => {
    if (stocks.length === 0) return;
    setLoading(true);
    for (const stock of stocks) {
      if (stock.code) {
        const newPrice = await getLivePrice(stock.code);
        await supabase
          .from("stocks")
          .update({ current_price: newPrice })
          .eq("id", stock.id);
      }
    }
    await fetchStocks();
    setLoading(false);
  };

  // 계산 로직
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
          <div>
            <h1 className="text-3xl font-black text-slate-900">MY PORTFOLIO</h1>
            <p className="text-slate-500 text-sm">
              실시간 가격이 반영되는 개인 자산 관리 대시보드
            </p>
          </div>
          <button
            onClick={refreshPrices}
            disabled={loading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm hover:bg-slate-50 font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            가격 갱신
          </button>
        </div>

        {/* 요약 카드 */}
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
              {totalProfit > 0 ? "+" : ""}
              {totalProfit.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-1">수익률</p>
            <p
              className={`text-2xl font-black ${totalProfit >= 0 ? "text-blue-600" : "text-red-500"}`}
            >
              {totalProfit > 0 ? "+" : ""}
              {totalRate}%
            </p>
          </div>
        </div>

        {/* 입력란 */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-400 mb-2">
                종목명
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="삼성전자"
                className="w-full bg-slate-50 p-2.5 rounded-lg border focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                종목코드
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="005930"
                className="w-full bg-slate-50 p-2.5 rounded-lg border focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                수량
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 p-2.5 rounded-lg border focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                매수평단가
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 p-2.5 rounded-lg border focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addStock}
                disabled={loading}
                className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:bg-slate-400"
              >
                {loading ? "조회 중..." : "추가하기"}
              </button>
            </div>
          </div>
        </div>

        {/* 목록 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Asset / Code</th>
                <th className="p-4 text-right">Weight</th>
                <th className="p-4 text-right">Price Info</th>
                <th className="p-4 text-right">Profit</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((stock) => {
                const profitRate = (
                  ((stock.current_price - stock.avg_price) / stock.avg_price) *
                  100
                ).toFixed(2);
                const weight =
                  totalInvested > 0
                    ? (
                        ((stock.avg_price * stock.quantity) / totalInvested) *
                        100
                      ).toFixed(1)
                    : 0;
                return (
                  <tr
                    key={stock.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {stock.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stock.code} | {stock.quantity}주 보유
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm font-medium">{weight}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-1">
                        <div
                          className="bg-slate-900 h-1 rounded-full"
                          style={{ width: `${weight}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-sm">
                        {stock.current_price?.toLocaleString()}원
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        평단 {stock.avg_price?.toLocaleString()}원
                      </div>
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${profitRate >= 0 ? "text-blue-600" : "text-red-500"}`}
                    >
                      <div className="text-sm">{profitRate}%</div>
                      <div className="text-[10px]">
                        {(
                          (stock.current_price - stock.avg_price) *
                          stock.quantity
                        ).toLocaleString()}
                        원
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteStock(stock.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {stocks.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-slate-400 text-sm"
                  >
                    등록된 종목이 없습니다. 첫 종목을 추가해보세요!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
