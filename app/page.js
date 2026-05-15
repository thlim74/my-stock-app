"use client";

import React, { useState, useRef, useMemo } from "react";

/**
 * [STOCK-MANAGER V8.0 TOTAL FINAL]
 * 1. 주가지수 대시보드 디자인 원복 (크게 표시)
 * 2. 거래관리: 수수료, 세금, 합계 항목 복구 및 고정
 * 3. 엑셀 업로드: 티커 누락 시 자동 추가 / 시장, 섹터 누락 시 자동 추가 로직 반영
 * 4. 선택 삭제 기능: 체크박스를 통한 일괄 삭제 추가
 * 5. 디자인 임의 변경 금지 및 8개 탭 무삭제 통합
 */

export default function StockManagerFullVersion() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // 선택 삭제용
  const fileInputRef = useRef(null);

  // --- [초기 데이터] ---
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      날짜: "2026-05-14",
      구분: "매수",
      종목명: "삼성전자",
      티커: "005930",
      수량: 100,
      단가: 72000,
      수수료: 500,
      세금: 0,
      합계: 7200500,
    },
  ]);
  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      날짜: "2026-05-01",
      구분: "입금",
      금액: 10000000,
      메모: "투자 시드",
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
    {
      id: 2,
      티커: "000660",
      종목명: "SK하이닉스",
      시장: "KOSPI",
      섹터: "반도체",
    },
  ]);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("2026-05-11");
  const [endDate, setEndDate] = useState(today);

  // --- [입력 폼 상태] ---
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

  // --- [자동 보충 로직] ---
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

  // --- [CRUD & 선택 삭제] ---
  const saveTx = () => {
    const total =
      newTx.구분 === "매수"
        ? Number(newTx.수량) * Number(newTx.단가) +
          Number(newTx.수수료) +
          Number(newTx.세금)
        : Number(newTx.수량) * Number(newTx.단가) -
          Number(newTx.수수료) -
          Number(newTx.세금);
    const data = { ...newTx, id: editingId || Date.now(), 합계: total };
    if (editingId)
      setTransactions(transactions.map((t) => (t.id === editingId ? data : t)));
    else setTransactions([data, ...transactions]);
    resetForms();
  };

  const deleteSelected = () => {
    if (!confirm(`${selectedIds.length}건을 삭제하시겠습니까?`)) return;
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

  // --- [업로드 로직: 누락 데이터 자동 추가] ---
  const onUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split("\n").slice(1);
      const imported = lines
        .filter((l) => l.trim() !== "")
        .map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          if (activeTab === "거래관리") {
            const found = stockMaster.find((s) => s.종목명 === cols[2]);
            return {
              id: Math.random(),
              날짜: cols[0],
              구분: cols[1],
              종목명: cols[2],
              티커: cols[3] || (found ? found.티커 : "N/A"),
              수량: Number(cols[4]),
              단가: Number(cols[5]),
              수수료: Number(cols[6] || 0),
              세금: Number(cols[7] || 0),
              합계: Number(cols[8] || 0),
            };
          }
          if (activeTab === "종목마스터") {
            return {
              id: Math.random(),
              티커: cols[0],
              종목명: cols[1],
              시장: cols[2] || "KOSPI",
              섹터: cols[3] || "미지정",
            };
          }
          if (activeTab === "입출금") {
            return {
              id: Math.random(),
              날짜: cols[0],
              구분: cols[1],
              금액: Number(cols[2]),
              메모: cols[3],
            };
          }
          return null;
        })
        .filter((d) => d !== null);

      if (activeTab === "거래관리")
        setTransactions([...imported, ...transactions]);
      if (activeTab === "종목마스터")
        setStockMaster([...imported, ...stockMaster]);
      if (activeTab === "입출금") setCashFlows([...imported, ...cashFlows]);
      alert(`${imported.length}건 반영 완료 (누락 정보 자동 보충됨)`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* [원복] 주가지수 대시보드 - 크게 표시 */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { n: "KOSPI", v: "2,743.18", d: "-0.12%", up: false },
            { n: "KOSDAQ", v: "829.82", d: "-0.14%", up: false },
            { n: "S&P 500", v: "5,501.24", d: "+0.77%", up: true },
            { n: "NASDAQ", v: "18,635.22", d: "+0.88%", up: true },
            { n: "USD/KRW", v: "1,352.50", d: "+0.22%", up: true },
          ].map((idx, i) => (
            <div
              key={i}
              className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center transition-all hover:shadow-md"
            >
              <div>
                <p className="text-[11px] font-black text-slate-400 mb-1 uppercase tracking-wider">
                  {idx.n}
                </p>
                <p className="text-2xl font-black">{idx.v}</p>
              </div>
              <div
                className={`text-[12px] font-black px-3 py-1.5 rounded-xl ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.d}
              </div>
            </div>
          ))}
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

        {/* 메인 시스템 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[800px]">
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
                className={`px-6 py-4 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10">
            {/* 공통 툴바 */}
            <div className="flex justify-between items-center mb-8">
              <div>
                {selectedIds.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[11px] font-black shadow-lg animate-bounce"
                  >
                    선택 {selectedIds.length}건 삭제
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
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200"
                  >
                    엑셀 업로드 ↑
                  </button>
                  <button
                    onClick={() => alert("CSV 다운로드 준비")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-black"
                  >
                    엑셀 다운로드 ↓
                  </button>
                </div>
              )}
            </div>

            {/* --- 탭 1: 거래관리 (항목 복구) --- */}
            {activeTab === "거래관리" && (
              <div>
                <div
                  className={`mb-10 p-8 rounded-3xl border grid grid-cols-4 gap-4 items-end ${editingId ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveTx}
                    className="bg-slate-900 text-white py-4 rounded-xl text-[12px] font-black"
                  >
                    {editingId ? "수정" : "저장"}
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedIds(transactions.map((t) => t.id));
                            else setSelectedIds([]);
                          }}
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
                  <tbody className="text-[12px] font-bold">
                    {transactions.map((t) => (
                      <tr key={t.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedIds([...selectedIds, t.id]);
                              else
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== t.id),
                                );
                            }}
                          />
                        </td>
                        <td>{t.날짜}</td>
                        <td>
                          <span
                            className={
                              t.구분 === "매수"
                                ? "text-rose-500"
                                : "text-blue-500"
                            }
                          >
                            {t.구분}
                          </span>
                        </td>
                        <td>{t.종목명}</td>
                        <td className="text-blue-600 italic">{t.티커}</td>
                        <td>{formatNum(t.수량)}</td>
                        <td>{formatNum(t.단가)}</td>
                        <td>{formatNum(t.수수료)}</td>
                        <td>{formatNum(t.세금)}</td>
                        <td className="text-blue-700">₩{formatNum(t.합계)}</td>
                        <td className="space-x-2">
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

            {/* --- 탭 2: 종목마스터 (배경 회색) --- */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-10 p-8 rounded-3xl bg-[#f1f5f9] border border-slate-300 grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase">
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
                    <label className="text-[11px] font-black text-slate-500 uppercase">
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
                    <label className="text-[11px] font-black text-slate-500 uppercase">
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
                    정보 등록/수정
                  </button>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedIds(stockMaster.map((s) => s.id));
                            else setSelectedIds([]);
                          }}
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
                      <tr key={s.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedIds([...selectedIds, s.id]);
                              else
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== s.id),
                                );
                            }}
                          />
                        </td>
                        <td className="text-blue-600 font-black italic">
                          {s.티커}
                        </td>
                        <td>{s.종목명}</td>
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

            {/* --- 탭 3: 보유종목일별 (5일 실적) --- */}
            {activeTab === "보유종목일별" && (
              <div>
                <div className="flex gap-4 mb-8 items-end bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      조회기간
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded-lg p-2 text-xs font-bold"
                      />
                      <span>~</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded-lg p-2 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-black h-[38px]">
                    데이터 필터
                  </button>
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

            {/* 나머지 8개 탭 로직 (공통 Border 적용) */}
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
                    <th>평가손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  <tr className="h-16">
                    <td>
                      삼성전자{" "}
                      <span className="block text-[10px] text-slate-400">
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
                    <tr>
                      <th className="w-10">
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
                      <tr key={c.id} className="h-14 hover:bg-slate-50">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedIds([...selectedIds, c.id]);
                              else
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== c.id),
                                );
                            }}
                          />
                        </td>
                        <td>{c.날짜}</td>
                        <td className="text-emerald-600">입금</td>
                        <td className="text-right pr-10">
                          ₩{formatNum(c.금액)}
                        </td>
                        <td>{c.메모}</td>
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

            {activeTab === "일별종가" && (
              <table className="w-full text-center border-collapse border border-slate-300">
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
                    <td className="text-slate-400 uppercase">12,500,123</td>
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
        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
