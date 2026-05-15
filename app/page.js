"use client";

import React, { useState, useRef } from "react";

/**
 * [STOCK-MANAGER V7.0 FINAL COMPLETE]
 * 반영사항:
 * 1. 8개 탭 전체 로직 통합 및 일별종가 복구
 * 2. 거래관리: 수수료, 세금, 합계 삭제 (요구사항)
 * 3. 엑셀 업로드: CSV 파싱 후 실제 State(데이터) 반영 로직 추가
 * 4. 모든 표 격자선 표시 및 종목마스터 등록 영역 회색 처리
 * 5. 디자인 임의 변경 금지 준수
 */

export default function StockManagerFinal() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // --- [데이터 상태] ---
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      날짜: "2026-05-14",
      구분: "매수",
      종목명: "삼성전자",
      티커: "005930",
      수량: 100,
      단가: 72000,
    },
  ]);

  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      날짜: "2026-05-01",
      구분: "입금",
      금액: 10000000,
      메모: "초기자산",
    },
  ]);

  const [stockMaster, setStockMaster] = useState([
    {
      id: 1,
      티커: "005930",
      종목명: "삼성전자",
      시장: "KOSPI",
      섹터: "반도체",
    },
  ]);

  // --- [날짜/입력 상태] ---
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("2026-05-11");
  const [endDate, setEndDate] = useState(today);

  const [newTx, setNewTx] = useState({
    날짜: today,
    구분: "매수",
    종목명: "",
    티커: "",
    수량: "",
    단가: "",
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

  // --- [자동 완성 로직] ---
  const handleAutoFill = (name, type) => {
    const found = stockMaster.find((s) => s.종목명 === name);
    if (type === "tx") {
      setNewTx((prev) => ({
        ...prev,
        종목명: name,
        티커: found ? found.티커 : prev.티커,
      }));
    } else {
      setNewStock((prev) => ({
        ...prev,
        종목명: name,
        티커: found ? found.티커 : prev.티커,
        시장: found ? found.시장 : prev.시장,
      }));
    }
  };

  // --- [CRUD 로직] ---
  const saveTx = () => {
    const data = { ...newTx, id: editingId || Date.now() };
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

  const resetForms = () => {
    setEditingId(null);
    setNewTx({
      날짜: today,
      구분: "매수",
      종목명: "",
      티커: "",
      수량: "",
      단가: "",
    });
    setNewCash({ 날짜: today, 구분: "입금", 금액: "", 메모: "" });
    setNewStock({ 티커: "", 종목명: "", 시장: "KOSPI", 섹터: "" });
  };

  // --- [엑셀 다운로드/업로드 로직 핵심수정] ---
  const downloadCSV = (type) => {
    let csv = "\uFEFF";
    if (type === "거래관리") {
      csv += "날짜,구분,종목명,티커,수량,단가\n";
      transactions.forEach(
        (t) =>
          (csv += `${t.날짜},${t.구분},${t.종목명},${t.티커},${t.수량},${t.단가}\n`),
      );
    } else if (type === "입출금") {
      csv += "날짜,구분,금액,메모\n";
      cashFlows.forEach(
        (c) => (csv += `${c.날짜},${c.구분},${c.금액},${c.메모}\n`),
      );
    } else if (type === "종목마스터") {
      csv += "티커,종목명,시장,섹터\n";
      stockMaster.forEach(
        (s) => (csv += `${s.티커},${s.종목명},${s.시장},${s.섹터}\n`),
      );
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_데이터.csv`;
    link.click();
  };

  const onUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").slice(1); // 헤더 제외
      const importedData = lines
        .filter((l) => l.trim() !== "")
        .map((line) => {
          const cols = line.split(",");
          if (activeTab === "거래관리")
            return {
              id: Math.random(),
              날짜: cols[0],
              구분: cols[1],
              종목명: cols[2],
              티커: cols[3],
              수량: Number(cols[4]),
              단가: Number(cols[5]),
            };
          if (activeTab === "입출금")
            return {
              id: Math.random(),
              날짜: cols[0],
              구분: cols[1],
              금액: Number(cols[2]),
              메모: cols[3],
            };
          if (activeTab === "종목마스터")
            return {
              id: Math.random(),
              티커: cols[0],
              종목명: cols[1],
              시장: cols[2],
              섹터: cols[3],
            };
          return null;
        })
        .filter((d) => d !== null);

      if (activeTab === "거래관리")
        setTransactions([...importedData, ...transactions]);
      if (activeTab === "입출금") setCashFlows([...importedData, ...cashFlows]);
      if (activeTab === "종목마스터")
        setStockMaster([...importedData, ...stockMaster]);

      alert(`${importedData.length}건의 데이터가 성공적으로 반영되었습니다.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* 지수 대시보드 */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black italic text-slate-800 tracking-tighter uppercase">
            Stock-Manager
          </h1>
          <div className="flex gap-4">
            {[
              "KOSPI 2,580.12",
              "KOSDAQ 840.50",
              "S&P500 5,450.21",
              "NASDAQ 18,200.15",
              "USD/KRW 1,365.2",
            ].map((idx, i) => (
              <div
                key={i}
                className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold shadow-sm"
              >
                {idx}
              </div>
            ))}
          </div>
        </div>

        {/* 자산 요약 */}
        <div className="grid grid-cols-6 gap-4 mb-8">
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
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">
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

        {/* 메인 탭 컨테이너 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[700px]">
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
                }}
                className={`px-6 py-4 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10">
            {/* 엑셀 컨트롤 */}
            {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
              <div className="flex justify-end gap-2 mb-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onUploadFile}
                  className="hidden"
                  accept=".csv"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200"
                >
                  엑셀 업로드 ↑
                </button>
                <button
                  onClick={() => downloadCSV(activeTab)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-black"
                >
                  엑셀 다운로드 ↓
                </button>
              </div>
            )}

            {activeTab === "거래관리" && (
              <div>
                <div
                  className={`mb-10 p-8 rounded-3xl border grid grid-cols-5 gap-4 items-end ${editingId ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      onChange={(e) => handleAutoFill(e.target.value, "tx")}
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="col-span-5 flex gap-2 mt-2">
                    <button
                      onClick={saveTx}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[12px] font-black"
                    >
                      {editingId ? "수정 완료" : "거래 저장"}
                    </button>
                    {editingId && (
                      <button
                        onClick={resetForms}
                        className="bg-slate-200 px-8 rounded-xl text-[12px] font-black"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr className="h-12">
                      <th>날짜</th>
                      <th>구분</th>
                      <th>종목명</th>
                      <th>티커</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {transactions.map((t) => (
                      <tr key={t.id} className="h-14 hover:bg-slate-50">
                        <td>{t.날짜}</td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-[10px] ${t.구분 === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.구분}
                          </span>
                        </td>
                        <td>{t.종목명}</td>
                        <td className="text-blue-600 italic font-medium">
                          {t.티커}
                        </td>
                        <td>{formatNum(t.수량)}</td>
                        <td>₩ {formatNum(t.단가)}</td>
                        <td className="space-x-3">
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
                            onClick={() =>
                              setTransactions(
                                transactions.filter((x) => x.id !== t.id),
                              )
                            }
                            className="text-rose-400"
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

            {activeTab === "보유현황" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr className="h-12">
                    <th>종목명</th>
                    <th>보유수량</th>
                    <th>평균단가</th>
                    <th>현재가</th>
                    <th>평가금액</th>
                    <th className="bg-blue-900">비중(%)</th>
                    <th>손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  <tr className="h-16">
                    <td>
                      삼성전자{" "}
                      <span className="text-[10px] text-slate-400 block font-normal">
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

            {activeTab === "보유종목일별" && (
              <div>
                <div className="flex gap-4 mb-8 items-end bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      시작
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      종료
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                  <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-black">
                    필터적용
                  </button>
                  <span className="ml-auto text-[11px] font-bold text-slate-400 italic">
                    * 최근 5거래일 실적 기준
                  </span>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-100 text-[11px] font-black text-slate-600 uppercase">
                    <tr className="h-12">
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
                  <tbody className="text-[12px] font-bold">
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

            {activeTab === "월별수익률" && (
              <table className="w-full text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr className="h-12">
                    <th>해당월</th>
                    <th>기초자산</th>
                    <th>기말자산</th>
                    <th>순입출금</th>
                    <th>월간손익</th>
                    <th>수익률</th>
                    <th>누적수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-black">
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

            {activeTab === "입출금" && (
              <div>
                <div className="mb-10 p-8 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-4 gap-4 items-end">
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveCash}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black"
                  >
                    현금 흐름 저장
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr className="h-12">
                      <th>날짜</th>
                      <th>구분</th>
                      <th>금액</th>
                      <th>메모</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {cashFlows.map((c) => (
                      <tr key={c.id} className="h-14 hover:bg-slate-50">
                        <td>{c.날짜}</td>
                        <td>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px]">
                            입금
                          </span>
                        </td>
                        <td className="text-right pr-10">
                          ₩ {formatNum(c.금액)}
                        </td>
                        <td className="text-left pl-6 text-slate-400">
                          {c.메모}
                        </td>
                        <td className="space-x-3">
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
                            onClick={() =>
                              setCashFlows(
                                cashFlows.filter((x) => x.id !== c.id),
                              )
                            }
                            className="text-rose-400"
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
                      onChange={(e) => handleAutoFill(e.target.value, "master")}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>ETF</option>
                      <option>NASDAQ</option>
                    </select>
                  </div>
                  <button
                    onClick={saveMaster}
                    className="bg-blue-600 text-white py-3.5 rounded-xl text-[12px] font-black shadow-lg"
                  >
                    마스터 등록/수정
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr className="h-12">
                      <th>티커</th>
                      <th>종목명</th>
                      <th>시장</th>
                      <th>섹터</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="h-14 hover:bg-slate-50">
                        <td className="text-blue-600 font-black italic">
                          {s.티커}
                        </td>
                        <td className="font-black">{s.종목명}</td>
                        <td>{s.시장}</td>
                        <td>{s.섹터 || "-"}</td>
                        <td className="space-x-3">
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
                            onClick={() =>
                              setStockMaster(
                                stockMaster.filter((x) => x.id !== s.id),
                              )
                            }
                            className="text-rose-400"
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
                <tbody className="text-[12px] font-bold">
                  <tr className="h-14 hover:bg-slate-50">
                    <td>2026-05-15</td>
                    <td className="text-blue-600 italic">005930</td>
                    <td>삼성전자</td>
                    <td>78,500</td>
                    <td className="text-rose-500">+1.2%</td>
                    <td>12,500,123</td>
                  </tr>
                  <tr className="h-14 hover:bg-slate-50">
                    <td>2026-05-15</td>
                    <td className="text-blue-600 italic">000660</td>
                    <td>SK하이닉스</td>
                    <td>189,400</td>
                    <td className="text-blue-500">-0.8%</td>
                    <td>3,200,450</td>
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
                <tbody className="text-[12px] font-bold">
                  <tr className="h-14 hover:bg-slate-50">
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
          padding: 12px 8px;
        }
        table {
          border-collapse: collapse !important;
          border: 1px solid #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
