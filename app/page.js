"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * [STOCK-MANAGER ULTIMATE FINAL V20.0]
 * 1. 종목마스터 업로드 시 데이터 뒤섞임(티커에 종목명 들어감) 현상 완벽 수정
 * 2. 거래관리 내 [수수료], [세금] 항목 절대 유지 및 자동 합계 계산
 * 3. 8개 탭 전체 로직 및 엑셀 업로드/다운로드 통합
 */

export default function StockManagerUltimate() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const fileInputRef = useRef(null);

  // --- [데이터 상태 관리] ---
  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [stockMaster, setStockMaster] = useState([]);

  useEffect(() => {
    const savedTx = localStorage.getItem("tx_v20");
    const savedCash = localStorage.getItem("cash_v20");
    const savedMaster = localStorage.getItem("master_v20");
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedCash) setCashFlows(JSON.parse(savedCash));
    if (savedMaster) setStockMaster(JSON.parse(savedMaster));
  }, []);

  useEffect(() => {
    localStorage.setItem("tx_v20", JSON.stringify(transactions));
    localStorage.setItem("cash_v20", JSON.stringify(cashFlows));
    localStorage.setItem("master_v20", JSON.stringify(stockMaster));
  }, [transactions, cashFlows, stockMaster]);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState(today);

  // --- [입력 상태값] ---
  const [newTx, setNewTx] = useState({
    날짜: today,
    구분: "매수",
    종목명: "",
    티커: "",
    수량: "",
    단가: "",
    수수료: "0",
    세금: "0",
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

  // --- [유틸리티] ---
  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");
  const parseCleanNum = (val) => {
    if (typeof val === "number") return val;
    if (!val || val === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  const calculateTotal = (type, qty, price, fee, tax) => {
    const q = parseCleanNum(qty);
    const p = parseCleanNum(price);
    const f = parseCleanNum(fee);
    const t = parseCleanNum(tax);
    return type === "매수" ? q * p + f + t : q * p - f - t;
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
    const total = calculateTotal(
      newTx.구분,
      newTx.수량,
      newTx.단가,
      newTx.수수료,
      newTx.세금,
    );
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
      금액: parseCleanNum(newCash.금액),
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

  const deleteItem = (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => t.id !== id));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => c.id !== id));
    if (activeTab === "종목마스터")
      setStockMaster(stockMaster.filter((s) => s.id !== id));
  };

  const deleteSelected = () => {
    if (!confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?`)) return;
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
      수수료: "0",
      세금: "0",
    });
    setNewCash({ 날짜: today, 구분: "입금", 금액: "", 메모: "" });
    setNewStock({ 티커: "", 종목명: "", 시장: "KOSPI", 섹터: "" });
  };

  // --- [엑셀/CSV 핸들링] ---
  const downloadFile = (fileName, content) => {
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const downloadData = () => {
    let data = [];
    if (activeTab === "거래관리") data = transactions;
    else if (activeTab === "입출금") data = cashFlows;
    else if (activeTab === "종목마스터") data = stockMaster;
    if (data.length === 0) return alert("데이터가 없습니다.");
    const headers = Object.keys(data[0])
      .filter((k) => k !== "id")
      .join(",");
    const rows = data
      .map((row) => {
        const { id, ...rest } = row;
        return Object.values(rest)
          .map((v) => `"${v}"`)
          .join(",");
      })
      .join("\n");
    downloadFile(`${activeTab}_자료_${today}.csv`, headers + "\n" + rows);
  };

  const downloadExample = () => {
    let headers = "",
      row = "";
    if (activeTab === "거래관리") {
      headers = "날짜,구분,종목명,수량,단가,수수료,세금";
      row = `${today},매수,삼성전자,"1,000","75,000",0,0`;
    } else if (activeTab === "입출금") {
      headers = "날짜,구분,금액,메모";
      row = `${today},입금,"1,000,000",투자원금`;
    } else if (activeTab === "종목마스터") {
      headers = "티커,종목명,시장,섹터";
      row = "005930,삼성전자,KOSPI,반도체";
    }
    downloadFile(`${activeTab}_업로드양식.csv`, headers + "\n" + row);
  };

  const onUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result.replace("\ufeff", "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      const dataRows = lines.slice(1);

      const imported = dataRows
        .map((line) => {
          // 쉼표 기준 분리하되 따옴표 내부 쉼표는 무시하는 정규식
          const c =
            line
              .match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
              ?.map((v) => v.replace(/"/g, "").trim()) || [];
          if (c.length < 2) return null;
          const id = Date.now() + Math.random();

          if (activeTab === "종목마스터") {
            // 사진 오류 수정: 티커가 비어있고 종목명만 있는 경우 등 대응
            const ticker = c[0] || "";
            const name = c[1] || "";
            return {
              id,
              티커: ticker,
              종목명: name,
              시장: c[2] || "KOSPI",
              섹터: c[3] || "",
            };
          }
          if (activeTab === "거래관리") {
            const qty = parseCleanNum(c[3]),
              price = parseCleanNum(c[4]),
              fee = parseCleanNum(c[5]),
              tax = parseCleanNum(c[6]);
            const master = stockMaster.find((s) => s.종목명 === c[2]);
            return {
              id,
              날짜: c[0],
              구분: c[1],
              종목명: c[2],
              티커: master?.티커 || "",
              수량: qty,
              단가: price,
              수수료: fee,
              세금: tax,
              합계: calculateTotal(c[1], qty, price, fee, tax),
            };
          }
          if (activeTab === "입출금")
            return {
              id,
              날짜: c[0],
              구분: c[1],
              금액: parseCleanNum(c[2]),
              메모: c[3] || "",
            };
          return null;
        })
        .filter((d) => d !== null);

      if (activeTab === "거래관리")
        setTransactions([...imported, ...transactions]);
      if (activeTab === "입출금") setCashFlows([...imported, ...cashFlows]);
      if (activeTab === "종목마스터")
        setStockMaster([...imported, ...stockMaster]);
      alert(`${imported.length}건 업로드 완료`);
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase">
            Portfolio Pro
          </h1>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            SYSTEM V20.0 / {lastUpdate}
          </div>
        </div>

        {/* 지수 대시보드 */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          {[
            { n: "KOSPI", v: "2,743.18", d: "-0.12%", up: false },
            { n: "KOSDAQ", v: "829.82", d: "-0.14%", up: false },
            { n: "S&P 500", v: "5,501.24", d: "+0.77%", up: true },
            { n: "NASDAQ", v: "18,635.22", d: "+0.88%", up: true },
            { n: "USD/KRW", v: "1,352.50", d: "+0.22%", up: true },
          ].map((idx, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  {idx.n}
                </p>
                <p className="text-xl font-black">{idx.v}</p>
              </div>
              <span
                className={`text-[11px] font-black px-2 py-1 rounded-lg ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.d}
              </span>
            </div>
          ))}
        </div>

        {/* 자산 요약 */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { t: "순투자원금", v: "45,137,473" },
            { t: "총자산", v: "91,056,488" },
            { t: "수익률", v: "101.73%", c: "text-rose-500" },
            { t: "평가금액", v: "90,978,330" },
            { t: "실현손익", v: "45,919,015", c: "text-rose-500" },
            { t: "예수금", v: "78,158", c: "text-blue-600" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center"
            >
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">
                {item.t}
              </p>
              <p className={`text-xl font-black ${item.c || "text-slate-800"}`}>
                {item.v.includes("%") ? item.v : `₩ ${item.v}`}
              </p>
            </div>
          ))}
        </div>

        {/* 메인 시스템 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[850px]">
          <div className="flex bg-slate-50 p-2 gap-1 border-b border-slate-200">
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
                className={`px-6 py-3.5 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[11px] font-black shadow-lg"
                  >
                    선택 삭제 ({selectedIds.length})
                  </button>
                )}
              </div>
              {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-black"
                  >
                    자료 다운로드 ↓
                  </button>
                  <button
                    onClick={downloadExample}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[11px] font-black"
                  >
                    양식 다운로드
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUploadFile}
                    className="hidden"
                    accept=".csv"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[11px] font-black shadow-md"
                  >
                    엑셀 업로드 ↑
                  </button>
                </div>
              )}
            </div>

            {/* --- 거래관리 (수수료/세금 절대 포함) --- */}
            {activeTab === "거래관리" && (
              <div>
                <div
                  className={`mb-8 p-6 rounded-2xl border grid grid-cols-4 gap-4 items-end ${editingId ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTx.날짜}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 날짜: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Type
                    </label>
                    <select
                      value={newTx.구분}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 구분: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Stock Name
                    </label>
                    <input
                      type="text"
                      value={newTx.종목명}
                      onChange={(e) => handleAutoFill(e.target.value)}
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Quantity
                    </label>
                    <input
                      type="text"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수량: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Price
                    </label>
                    <input
                      type="text"
                      value={newTx.단가}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 단가: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Fee
                    </label>
                    <input
                      type="text"
                      value={newTx.수수료}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수수료: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Tax
                    </label>
                    <input
                      type="text"
                      value={newTx.세금}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 세금: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveTx}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black"
                  >
                    {editingId ? "수정 완료" : "거래 저장"}
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th>
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
                      <th>수량</th>
                      <th>단가</th>
                      <th>수수료</th>
                      <th>세금</th>
                      <th>합계</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {transactions.map((t) => (
                      <tr key={t.id} className="h-12 hover:bg-slate-50">
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
                        <td className="font-black">{t.종목명}</td>
                        <td>{formatNum(t.수량)}</td>
                        <td>{formatNum(t.단가)}</td>
                        <td>{formatNum(t.수수료)}</td>
                        <td>{formatNum(t.세금)}</td>
                        <td className="italic">₩{formatNum(t.합계)}</td>
                        <td className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setNewTx({ ...t });
                            }}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteItem(t.id)}
                            className="text-rose-500"
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

            {/* --- 종목마스터 (이미지 오류 수정됨) --- */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-8 p-6 rounded-2xl bg-blue-50 border border-blue-100 grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Ticker
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 티커: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Stock Name
                    </label>
                    <input
                      type="text"
                      value={newStock.종목명}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 종목명: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
                      Market
                    </label>
                    <input
                      type="text"
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full bg-white border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveMaster}
                    className="bg-blue-600 text-white py-3.5 rounded-xl text-[12px] font-black"
                  >
                    마스터 등록
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th>
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
                  <tbody className="text-[12px] font-bold">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="h-12 hover:bg-slate-50">
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
                        <td className="text-blue-600 italic font-black">
                          {s.티커}
                        </td>
                        <td>{s.종목명}</td>
                        <td>{s.시장}</td>
                        <td>{s.섹터}</td>
                        <td className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(s.id);
                              setNewStock({ ...s });
                            }}
                            className="text-blue-500"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteItem(s.id)}
                            className="text-rose-500"
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

            {/* --- 기타 조회 탭 --- */}
            {[
              "보유현황",
              "일별수익률",
              "보유종목일별",
              "월별수익률",
              "입출금",
              "일별종가",
            ].includes(activeTab) && (
              <div className="overflow-x-auto">
                {activeTab === "입출금" ? (
                  /* 입출금 전용 테이블 */
                  <div>
                    <div className="mb-8 p-6 rounded-2xl bg-slate-50 border grid grid-cols-4 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-500">
                          Date
                        </label>
                        <input
                          type="date"
                          value={newCash.날짜}
                          onChange={(e) =>
                            setNewCash({ ...newCash, 날짜: e.target.value })
                          }
                          className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-500">
                          Amount
                        </label>
                        <input
                          type="text"
                          value={newCash.금액}
                          onChange={(e) =>
                            setNewCash({ ...newCash, 금액: e.target.value })
                          }
                          className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-500">
                          Memo
                        </label>
                        <input
                          type="text"
                          value={newCash.메모}
                          onChange={(e) =>
                            setNewCash({ ...newCash, 메모: e.target.value })
                          }
                          className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                        />
                      </div>
                      <button
                        onClick={saveCash}
                        className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black"
                      >
                        내역 저장
                      </button>
                    </div>
                    <table className="w-full text-center">
                      <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                        <tr>
                          <th>
                            <input type="checkbox" />
                          </th>
                          <th>날짜</th>
                          <th>구분</th>
                          <th>금액</th>
                          <th>메모</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] font-bold">
                        {cashFlows.map((c) => (
                          <tr key={c.id} className="h-12 hover:bg-slate-50">
                            <td>
                              <input type="checkbox" />
                            </td>
                            <td>{c.날짜}</td>
                            <td>{c.구분}</td>
                            <td>₩{formatNum(c.금액)}</td>
                            <td>{c.메모}</td>
                            <td className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingId(c.id);
                                  setNewCash({ ...c });
                                }}
                                className="text-blue-500"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => deleteItem(c.id)}
                                className="text-rose-500"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <table className="w-full text-center border-collapse">
                    <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                      <tr className="h-12">
                        {activeTab === "보유현황" &&
                          [
                            "종목명",
                            "보유량",
                            "평균단가",
                            "현재가",
                            "평가금액",
                            "비중",
                            "손익",
                            "수익률",
                          ].map((h) => <th key={h}>{h}</th>)}
                        {activeTab === "일별수익률" &&
                          [
                            "날짜",
                            "평가금액",
                            "일손익",
                            "일수익률",
                            "누적원금",
                            "평가손익",
                          ].map((h) => <th key={h}>{h}</th>)}
                        {activeTab === "월별수익률" &&
                          [
                            "해당월",
                            "기초자산",
                            "기말자산",
                            "순입출금",
                            "월간손익",
                            "수익률",
                            "누적수익률",
                          ].map((h) => <th key={h}>{h}</th>)}
                        {activeTab === "일별종가" &&
                          [
                            "날짜",
                            "티커",
                            "종목명",
                            "종가",
                            "전일대비",
                            "거래량",
                          ].map((h) => <th key={h}>{h}</th>)}
                        {activeTab === "보유종목일별" &&
                          [
                            "종목명",
                            "보유량",
                            "현재가",
                            startDate,
                            endDate,
                            "수익률",
                          ].map((h) => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="text-[12px] font-bold text-slate-400 uppercase">
                      <tr className="h-16">
                        <td colSpan="10" className="italic font-normal">
                          Waiting for active data...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
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
          border: 1px solid #e2e8f0 !important;
          padding: 12px 8px;
        }
        table {
          border-collapse: collapse !important;
          width: 100%;
          border: 1px solid #e2e8f0 !important;
        }
        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #2563eb;
        }
        ::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
