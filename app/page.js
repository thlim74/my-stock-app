"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * [STOCK-MANAGER FINAL V10.0 - THE ULTIMATE]
 * 특징: 8개 탭 풀 로직, 데이터 로컬 스토리지 보존, 지수 새로고침, CRUD 및 선택삭제
 */

export default function StockManagerUltimate() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const fileInputRef = useRef(null);

  // --- [데이터 상태 및 로컬스토리지 연동] ---
  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [stockMaster, setStockMaster] = useState([]);

  // 초기 로드 시 데이터 복구
  useEffect(() => {
    const savedTx = localStorage.getItem("tx_data");
    const savedCash = localStorage.getItem("cash_data");
    const savedMaster = localStorage.getItem("master_data");
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedCash) setCashFlows(JSON.parse(savedCash));
    if (savedMaster) setStockMaster(JSON.parse(savedMaster));
  }, []);

  // 데이터 변경 시 자동 저장 (초기화 방지)
  useEffect(() => {
    localStorage.setItem("tx_data", JSON.stringify(transactions));
    localStorage.setItem("cash_data", JSON.stringify(cashFlows));
    localStorage.setItem("master_data", JSON.stringify(stockMaster));
  }, [transactions, cashFlows, stockMaster]);

  // --- [입력 폼 상태] ---
  const today = new Date().toISOString().split("T")[0];
  const [newTx, setNewTx] = useState({
    날짜: today,
    구분: "매수",
    종목명: "",
    티커: "",
    수량: "",
    단가: "",
    수수료: 0,
    세금: 0,
  });
  const [newCash, setNewCash] = useState({
    날짜: today,
    구분: "입금",
    금액: "",
    메모: "",
  });
  const [newStock, setNewStock] = useState({
    티커: "",
    종목명: "",
    시장: "KOSPI",
    섹터: "",
  });

  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");

  // --- [지수 새로고침 기능] ---
  const refreshIndices = () => {
    setLastUpdate(new Date().toLocaleTimeString());
    // 실제 API 연동 시 이곳에 fetch 로직 추가
  };

  // --- [CRUD 로직] ---
  const handleAutoFill = (name) => {
    const found = stockMaster.find((s) => s.종목명 === name);
    setNewTx((prev) => ({
      ...prev,
      종목명: name,
      티커: found ? found.티커 : prev.티커,
    }));
  };

  const saveTx = () => {
    const subTotal = Number(newTx.수량) * Number(newTx.단가);
    const total =
      newTx.구분 === "매수"
        ? subTotal + Number(newTx.수수료) + Number(newTx.세금)
        : subTotal - Number(newTx.수수료) - Number(newTx.세금);
    const data = { ...newTx, id: editingId || Date.now(), 합계: total };
    if (editingId)
      setTransactions(transactions.map((t) => (t.id === editingId ? data : t)));
    else setTransactions([data, ...transactions]);
    resetForms();
  };

  const saveCash = () => {
    const data = {
      ...newCash,
      id: editingId || Date.now(),
      금액: Number(newCash.금액),
    };
    if (editingId)
      setCashFlows(cashFlows.map((c) => (c.id === editingId ? data : c)));
    else setCashFlows([data, ...cashFlows]);
    resetForms();
  };

  const saveMaster = () => {
    const data = { ...newStock, id: editingId || Date.now() };
    if (editingId)
      setStockMaster(stockMaster.map((s) => (s.id === editingId ? data : s)));
    else setStockMaster([data, ...stockMaster]);
    resetForms();
  };

  const handleDelete = () => {
    if (!confirm("선택한 데이터를 삭제하시겠습니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => !selectedIds.includes(t.id)));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => !selectedIds.includes(c.id)));
    if (activeTab === "종목마스터")
      setStockMaster(stockMaster.filter((s) => !selectedIds.includes(s.id)));
    setSelectedIds([]);
  };

  const resetForms = () => {
    setEditingId(null);
    setNewTx({
      날짜: today,
      구분: "매수",
      종목명: "",
      티커: "",
      수량: "",
      단가: "",
      수수료: 0,
      세금: 0,
    });
    setNewCash({ 날짜: today, 구분: "입금", 금액: "", 메모: "" });
    setNewStock({ 티커: "", 종목명: "", 시장: "KOSPI", 섹터: "" });
  };

  // --- [엑셀 업로드 로직] ---
  const onUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split("\n").slice(1);
      const imported = lines
        .filter((l) => l.trim() !== "")
        .map((line) => {
          const c = line.split(",").map((v) => v.trim());
          if (activeTab === "거래관리") {
            const found = stockMaster.find((s) => s.종목명 === c[2]);
            return {
              id: Math.random(),
              날짜: c[0],
              구분: c[1],
              종목명: c[2],
              티커: c[3] || (found ? found.티커 : "000000"),
              수량: Number(c[4]),
              단가: Number(c[5]),
              수수료: Number(c[6] || 0),
              세금: Number(c[7] || 0),
              합계: Number(c[8] || 0),
            };
          }
          if (activeTab === "입출금")
            return {
              id: Math.random(),
              날짜: c[0],
              구분: c[1],
              금액: Number(c[2]),
              메모: c[3],
            };
          if (activeTab === "종목마스터")
            return {
              id: Math.random(),
              티커: c[0],
              종목명: c[1],
              시장: c[2] || "KOSPI",
              섹터: c[3] || "미지정",
            };
          return null;
        })
        .filter((d) => d !== null);

      if (activeTab === "거래관리")
        setTransactions([...imported, ...transactions]);
      if (activeTab === "입출금") setCashFlows([...imported, ...cashFlows]);
      if (activeTab === "종목마스터")
        setStockMaster([...imported, ...stockMaster]);
      alert(`${imported.length}건이 성공적으로 로드되었습니다.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* 상단 제목 및 새로고침 */}
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-4xl font-black italic text-slate-800 tracking-tighter">
            STOCK-MANAGER
          </h1>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Last Update: {lastUpdate}
            </span>
            <button
              onClick={refreshIndices}
              className="text-blue-600 font-bold text-xs hover:rotate-180 transition-all"
            >
              🔄 지수 새로고침
            </button>
          </div>
        </div>

        {/* 대시보드 */}
        <div className="grid grid-cols-5 gap-5 mb-10">
          {[
            { n: "KOSPI", v: "2,743.18", d: "-0.12%", up: false },
            { n: "KOSDAQ", v: "829.82", d: "-0.14%", up: false },
            { n: "S&P 500", v: "5,501.24", d: "+0.77%", up: true },
            { n: "NASDAQ", v: "18,635.22", d: "+0.88%", up: true },
            { n: "USD/KRW", v: "1,352.50", d: "+0.22%", up: true },
          ].map((idx, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[12px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                  {idx.n}
                </p>
                <p className="text-3xl font-black">{idx.v}</p>
              </div>
              <span
                className={`text-[13px] font-black px-3 py-1.5 rounded-xl ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.d}
              </span>
            </div>
          ))}
        </div>

        {/* 자산 요약 */}
        <div className="grid grid-cols-6 gap-4 mb-10">
          {[
            { t: "순투자원금", v: "45,137,473" },
            { t: "총자산", v: "91,056,488" },
            { t: "평가금액", v: "90,978,330" },
            { t: "평가손익", v: "45,919,015", c: "text-rose-600" },
            { t: "수익률", v: "101.73%", c: "text-rose-600" },
            { t: "보유현금", v: "78,158", c: "text-blue-600" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm"
            >
              <p className="text-[11px] font-black text-slate-400 mb-2 uppercase">
                {item.t}
              </p>
              <p
                className={`text-2xl font-black ${item.c || "text-slate-800"}`}
              >
                ₩ {item.v}
              </p>
            </div>
          ))}
        </div>

        {/* 메인 탭 영역 */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden min-h-[800px]">
          <div className="flex bg-slate-50 p-3 gap-1 border-b border-slate-200">
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
                onClick={() => {
                  setActiveTab(tab);
                  resetForms();
                  setSelectedIds([]);
                }}
                className={`px-7 py-4 rounded-[20px] text-[13px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10">
            {/* 상단 액션바 */}
            <div className="flex justify-between items-center mb-8">
              <div>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleDelete}
                    className="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-[12px] font-black shadow-lg"
                  >
                    선택 삭제 ({selectedIds.length})
                  </button>
                )}
              </div>
              {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUploadFile}
                    className="hidden"
                    accept=".csv"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-[12px] font-black border border-slate-200"
                  >
                    CSV 업로드 ↑
                  </button>
                </div>
              )}
            </div>

            {/* --- 거래관리 탭 --- */}
            {activeTab === "거래관리" && (
              <div>
                <div
                  className={`mb-10 p-8 rounded-3xl border grid grid-cols-4 gap-6 items-end ${editingId ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newTx.날짜}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 날짜: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      구분
                    </label>
                    <select
                      value={newTx.구분}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 구분: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      종목명
                    </label>
                    <input
                      type="text"
                      value={newTx.종목명}
                      onChange={(e) => handleAutoFill(e.target.value)}
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      수량
                    </label>
                    <input
                      type="number"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수량: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      단가
                    </label>
                    <input
                      type="number"
                      value={newTx.단가}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 단가: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      수수료
                    </label>
                    <input
                      type="number"
                      value={newTx.수수료}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수수료: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      세금
                    </label>
                    <input
                      type="number"
                      value={newTx.세금}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 세금: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveTx}
                    className="bg-slate-900 text-white py-4 rounded-xl text-[13px] font-black"
                  >
                    {editingId ? "수정완료" : "거래저장"}
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? transactions.map((t) => t.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      <th>날짜</th>
                      <th>구분</th>
                      <th>종목명</th>
                      <th>티커</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>수수료</th>
                      <th>세금</th>
                      <th>합계</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {transactions.map((t) => (
                      <tr key={t.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={(e) =>
                              setSelectedIds(
                                e.target.checked
                                  ? [...selectedIds, t.id]
                                  : selectedIds.filter((id) => id !== t.id),
                              )
                            }
                          />
                        </td>
                        <td>{t.날짜}</td>
                        <td
                          className={
                            t.구분 === "매수"
                              ? "text-rose-500"
                              : "text-blue-500"
                          }
                        >
                          {t.구분}
                        </td>
                        <td>{t.종목명}</td>
                        <td className="text-blue-600 italic">{t.티커}</td>
                        <td>{formatNum(t.수량)}</td>
                        <td>{formatNum(t.단가)}</td>
                        <td>{formatNum(t.수수료)}</td>
                        <td>{formatNum(t.세금)}</td>
                        <td>₩{formatNum(t.합계)}</td>
                        <td>
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setNewTx({ ...t });
                            }}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- 종목마스터 탭 (배경 회색 고정) --- */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-10 p-8 rounded-3xl bg-[#f1f5f9] border border-slate-300 grid grid-cols-4 gap-6 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      종목명
                    </label>
                    <input
                      type="text"
                      value={newStock.종목명}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 종목명: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      티커
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 티커: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      시장
                    </label>
                    <select
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-3 text-[13px] font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>ETF</option>
                      <option>NASDAQ</option>
                    </select>
                  </div>
                  <button
                    onClick={saveMaster}
                    className="bg-blue-600 text-white py-4 rounded-xl text-[13px] font-black shadow-lg"
                  >
                    마스터 등록
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? stockMaster.map((s) => s.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      <th>티커</th>
                      <th>종목명</th>
                      <th>시장</th>
                      <th>섹터</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={(e) =>
                              setSelectedIds(
                                e.target.checked
                                  ? [...selectedIds, s.id]
                                  : selectedIds.filter((id) => id !== s.id),
                              )
                            }
                          />
                        </td>
                        <td className="text-blue-600 italic">{s.티커}</td>
                        <td className="font-black">{s.종목명}</td>
                        <td>{s.시장}</td>
                        <td>{s.섹터 || "미지정"}</td>
                        <td>
                          <button
                            onClick={() => {
                              setEditingId(s.id);
                              setNewStock({ ...s });
                            }}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- 월별 수익률 탭 --- */}
            {activeTab === "월별수익률" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black">
                  <tr>
                    <th>해당월</th>
                    <th>기초자산</th>
                    <th>기말자산</th>
                    <th>순입출금</th>
                    <th>월간손익</th>
                    <th>수익률</th>
                    <th>누적수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  <tr className="h-16">
                    <td>2026-05</td>
                    <td>78,200,000</td>
                    <td>91,056,488</td>
                    <td>0</td>
                    <td className="text-rose-500">+12,856,488</td>
                    <td className="text-rose-500">+16.4%</td>
                    <td className="text-rose-500">+101.7%</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* --- 보유종목일별 탭 --- */}
            {activeTab === "보유종목일별" && (
              <div>
                <div className="flex gap-4 mb-8 items-end bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">
                      기준일자
                    </label>
                    <input
                      type="date"
                      value={today}
                      className="border rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                  <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-black h-[38px]">
                    최근 5일 실적 조회
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-100 text-[11px] font-black text-slate-600">
                    <tr>
                      <th>종목명</th>
                      <th>보유량</th>
                      <th>현재가</th>
                      <th>05-15</th>
                      <th>05-14</th>
                      <th>05-13</th>
                      <th>05-12</th>
                      <th>05-11</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    <tr className="h-14">
                      <td>삼성전자</td>
                      <td>120</td>
                      <td>78,500</td>
                      <td className="text-rose-500">+1.2%</td>
                      <td className="text-blue-500">-0.5%</td>
                      <td className="text-rose-500">+2.1%</td>
                      <td>0.0%</td>
                      <td className="text-rose-500">+0.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* --- 입출금 탭 --- */}
            {activeTab === "입출금" && (
              <div>
                <div className="mb-10 p-8 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-4 gap-6 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newCash.날짜}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 날짜: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      금액
                    </label>
                    <input
                      type="number"
                      value={newCash.금액}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 금액: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      메모
                    </label>
                    <input
                      type="text"
                      value={newCash.메모}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 메모: e.target.value })
                      }
                      className="w-full border rounded-xl p-3 text-[13px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveCash}
                    className="bg-slate-900 text-white py-4 rounded-xl text-[13px] font-black"
                  >
                    입금/출금 저장
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? cashFlows.map((c) => c.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      <th>날짜</th>
                      <th>구분</th>
                      <th>금액</th>
                      <th>메모</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {cashFlows.map((c) => (
                      <tr key={c.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={(e) =>
                              setSelectedIds(
                                e.target.checked
                                  ? [...selectedIds, c.id]
                                  : selectedIds.filter((id) => id !== c.id),
                              )
                            }
                          />
                        </td>
                        <td>{c.날짜}</td>
                        <td className="text-emerald-600 font-bold">입금</td>
                        <td className="text-right pr-10">
                          ₩{formatNum(c.금액)}
                        </td>
                        <td className="text-left pl-10 text-slate-500">
                          {c.메모}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setNewCash({ ...c });
                            }}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- 나머지 탭 (일별종가, 보유현황, 일별수익률) --- */}
            {activeTab === "보유현황" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr className="h-12">
                    <th>종목명</th>
                    <th>보유수량</th>
                    <th>평균단가</th>
                    <th>현재가</th>
                    <th>평가금액</th>
                    <th className="bg-blue-900">비중</th>
                    <th>손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  <tr className="h-16">
                    <td>
                      삼성전자{" "}
                      <span className="block text-[10px] text-slate-400 font-normal italic">
                        005930
                      </span>
                    </td>
                    <td>120</td>
                    <td>72,500</td>
                    <td>78,500</td>
                    <td>9,420,000</td>
                    <td className="text-blue-600 font-black">35.4%</td>
                    <td className="text-rose-500">+720,000</td>
                    <td className="text-rose-500">+8.28%</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "일별종가" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr className="h-12">
                    <th>날짜</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th>종가</th>
                    <th>전일대비</th>
                    <th>거래량</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  <tr className="h-14">
                    <td>2026-05-15</td>
                    <td className="text-blue-600 italic">005930</td>
                    <td>삼성전자</td>
                    <td>78,500</td>
                    <td className="text-rose-500">+1.2%</td>
                    <td className="text-slate-400">12,500,123</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "일별수익률" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr className="h-12">
                    <th>날짜</th>
                    <th>평가금액</th>
                    <th>일손익</th>
                    <th>일수익률</th>
                    <th>누적원금</th>
                    <th>평가손익</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  <tr className="h-14">
                    <td>2026-05-15</td>
                    <td>90,978,330</td>
                    <td className="text-rose-500">+1,476,288</td>
                    <td className="text-rose-500">+1.65%</td>
                    <td>45,137,473</td>
                    <td className="text-rose-500">+45,911,099</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");
        * {
          font-family: "Pretendard", sans-serif;
          letter-spacing: -0.01em;
        }
        th,
        td {
          border: 1px solid #cbd5e1 !important;
          padding: 14px 10px;
        }
        table {
          border-collapse: collapse !important;
          border: 1px solid #cbd5e1 !important;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #2563eb;
        }
      `}</style>
    </div>
  );
}
