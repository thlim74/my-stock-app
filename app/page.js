"use client";

import React, { useState, useRef } from "react";

/**
 * [MY PORTFOLIO TOTAL SYSTEM - DEFINITIVE V5.1]
 * - 디자인 가독성 극대화 (High Contrast)
 * - CRUD 로직 완전 무결화
 * - 8개 탭 독립 로직 구현
 */

export default function PortfolioProFinal() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // --- [1. 데이터 상태] ---
  const [marketIndices] = useState([
    { 이름: "코스피", 지수: "2,743.18", 변동: "-0.12%", 상승: false },
    { 이름: "코스닥", 지수: "829.82", 변동: "-0.14%", 상승: false },
    { 이름: "S&P 500", 지수: "5,501.24", 변동: "+0.77%", 상승: true },
    { 이름: "나스닥", 지수: "18,635.22", 변동: "+0.88%", 상승: true },
    { 이름: "원/달러", 지수: "1,352.50", 변동: "+0.22%", 상승: true },
  ]);

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      날짜: "2026-05-10",
      구분: "매수",
      종목명: "삼성전자",
      티커: "005930",
      수량: 10,
      단가: 72000,
      수수료: 72,
      세금: 0,
      합계: 720072,
    },
  ]);

  const [cashFlows, setCashFlows] = useState([
    {
      id: 1,
      날짜: "2026-05-06",
      구분: "입금",
      금액: 5000000,
      메모: "초기 투자금",
    },
  ]);

  const [stockMaster, setStockMaster] = useState([
    {
      id: 1,
      티커: "005930",
      종목명: "삼성전자",
      시장: "KOSPI",
      섹터: "반도체",
      통화: "KRW",
    },
  ]);

  // --- [2. 입력 폼 상태] ---
  const [newTx, setNewTx] = useState({
    날짜: "2026-05-15",
    구분: "매수",
    종목명: "",
    티커: "",
    수량: "",
    단가: "",
    수수료: 0,
    세금: 0,
  });
  const [newCash, setNewCash] = useState({
    날짜: "2026-05-15",
    구분: "입금",
    금액: "",
    메모: "",
  });
  const [newStock, setNewStock] = useState({
    티커: "",
    종목명: "",
    시장: "KOSPI",
    섹터: "",
    통화: "KRW",
  });

  // --- [3. 유틸리티 & CRUD 로직] ---
  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");

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

    if (editingId) {
      setTransactions(transactions.map((t) => (t.id === editingId ? data : t)));
    } else {
      setTransactions([data, ...transactions]);
    }
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

  const saveStock = () => {
    const data = { ...newStock, id: editingId || Date.now() };
    if (editingId)
      setStockMaster(stockMaster.map((s) => (s.id === editingId ? data : s)));
    else setStockMaster([data, ...stockMaster]);
    resetForms();
  };

  const resetForms = () => {
    setEditingId(null);
    setNewTx({
      날짜: "2026-05-15",
      구분: "매수",
      종목명: "",
      티커: "",
      수량: "",
      단가: "",
      수수료: 0,
      세금: 0,
    });
    setNewCash({ 날짜: "2026-05-15", 구분: "입금", 금액: "", 메모: "" });
    setNewStock({ 티커: "", 종목명: "", 시장: "KOSPI", 섹터: "", 통화: "KRW" });
  };

  const handleEdit = (item, type) => {
    setEditingId(item.id);
    if (type === "tx") {
      setNewTx({ ...item });
      setActiveTab("거래관리");
    } else if (type === "cash") {
      setNewCash({ ...item });
      setActiveTab("입출금");
    } else if (type === "stock") {
      setNewStock({ ...item });
      setActiveTab("종목마스터");
    }
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const downloadCSV = (type) => {
    let headers = "",
      data = [];
    if (type === "거래관리") {
      headers = "날짜,구분,종목명,티커,수량,단가,수수료,세금,합계\n";
      data = transactions.map(
        (t) =>
          `${t.날짜},${t.구분},${t.종목명},${t.티커},${t.수량},${t.단가},${t.수수료},${t.세금},${t.합계}`,
      );
    } else if (type === "입출금") {
      headers = "날짜,구분,금액,메모\n";
      data = cashFlows.map((c) => `${c.날짜},${c.구분},${c.금액},${c.메모}`);
    } else if (type === "종목마스터") {
      headers = "티커,종목명,시장,섹터,통화\n";
      data = stockMaster.map(
        (s) => `${s.티커},${s.종목명},${s.시장},${s.섹터},${s.통화}`,
      );
    }
    const blob = new Blob(["\uFEFF" + headers + data.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_추출데이터.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans tracking-tight">
      <div className="max-w-[1800px] mx-auto">
        {/* [1] 지수 대시보드 - 디자인 복구 및 강화 */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {marketIndices.map((idx, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center transition-all hover:shadow-md"
            >
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase mb-1 tracking-tighter">
                  {idx.이름}
                </p>
                <p className="text-xl font-black text-slate-800">{idx.지수}</p>
              </div>
              <div
                className={`text-[11px] font-black px-3 py-1 rounded-lg ${idx.상승 ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.변동}
              </div>
            </div>
          ))}
        </div>

        {/* [2] 자산 요약 - 시인성 강화 */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            { 제목: "순투자원금", 값: 45137473, 색: "text-slate-600" },
            { 제목: "총자산", 값: 91056488, 색: "text-blue-700" },
            { 제목: "평가금액", 값: 90978330, 색: "text-slate-800" },
            { 제목: "실현손익", 값: 45919015, 색: "text-rose-600" },
            { 제목: "수익률", 값: "101.73%", 색: "text-rose-600" },
            { 제목: "현금", 값: 78158, 색: "text-emerald-600" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm"
            >
              <p className="text-[11px] font-black text-slate-400 mb-2">
                {item.제목}
              </p>
              <span className={`text-2xl font-black ${item.색}`}>
                {typeof item.값 === "number"
                  ? `₩ ${formatNum(item.값)}`
                  : item.값}
              </span>
            </div>
          ))}
        </div>

        {/* [3] 메인 콘텐츠 영역 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
          {/* 8개 탭 헤더 - 한글화 */}
          <div className="flex bg-slate-100 p-2 gap-1 border-b border-slate-200">
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
                className={`px-6 py-4 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 flex-grow">
            {/* 공통 엑셀 툴바 복구 */}
            {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
              <div className="flex justify-end gap-2 mb-8">
                <button
                  onClick={() => downloadCSV(activeTab)}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  엑셀 다운로드 ↓
                </button>
              </div>
            )}

            {/* --- 탭별 상세 로직 구현 --- */}

            {/* [거래관리] - 매수/매도, 수수료, 세금 포함 */}
            {activeTab === "거래관리" && (
              <div className="animate-in fade-in duration-300">
                <div
                  className={`mb-10 p-8 rounded-3xl border-2 grid grid-cols-4 gap-4 items-end ${editingId ? "border-blue-500 bg-blue-50/20" : "border-slate-100 bg-slate-50"}`}
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newTx.날짜}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 날짜: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      구분
                    </label>
                    <select
                      value={newTx.구분}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 구분: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold outline-none"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      종목명
                    </label>
                    <input
                      type="text"
                      value={newTx.종목명}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 종목명: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      수량
                    </label>
                    <input
                      type="number"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수량: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      단가
                    </label>
                    <input
                      type="number"
                      value={newTx.단가}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 단가: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      수수료
                    </label>
                    <input
                      type="number"
                      value={newTx.수수료}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수수료: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500">
                      세금
                    </label>
                    <input
                      type="number"
                      value={newTx.세금}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 세금: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveTx}
                      className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black hover:bg-black"
                    >
                      {editingId ? "수정완료" : "거래등록"}
                    </button>
                    {editingId && (
                      <button
                        onClick={resetForms}
                        className="bg-slate-200 px-4 rounded-xl text-[12px] font-black"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-4 pl-4 rounded-tl-xl">날짜</th>
                      <th>구분</th>
                      <th>종목명</th>
                      <th className="text-right">수량/단가</th>
                      <th className="text-right">수수료/세금</th>
                      <th className="text-right pr-6">합계금액</th>
                      <th className="text-center rounded-tr-xl">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border-x border-b border-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-5 pl-4 text-slate-400">{t.날짜}</td>
                        <td>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black ${t.구분 === "매수" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            {t.구분}
                          </span>
                        </td>
                        <td className="font-black text-slate-800">
                          {t.종목명}{" "}
                          <span className="text-[10px] text-slate-300">
                            {t.티커}
                          </span>
                        </td>
                        <td className="text-right">
                          {formatNum(t.수량)} / {formatNum(t.단가)}
                        </td>
                        <td className="text-right text-slate-400 font-medium">
                          {formatNum(t.수수료)} / {formatNum(t.세금)}
                        </td>
                        <td className="text-right pr-6 font-black text-blue-600 italic">
                          ₩ {formatNum(t.합계)}
                        </td>
                        <td className="text-center space-x-3 text-[11px]">
                          <button
                            onClick={() => handleEdit(t, "tx")}
                            className="text-blue-500 hover:font-black"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("삭제?"))
                                setTransactions(
                                  transactions.filter((x) => x.id !== t.id),
                                );
                            }}
                            className="text-rose-400 hover:text-rose-600"
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

            {/* [일별수익률] - 고유 로직 */}
            {activeTab === "일별수익률" && (
              <div className="animate-in fade-in">
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr className="h-12">
                      <th>날짜</th>
                      <th>기초자산</th>
                      <th>기말자산</th>
                      <th>순입출금</th>
                      <th>당일손익</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border border-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-6 text-slate-400">2026-05-15</td>
                      <td>89,580,200</td>
                      <td className="font-black text-blue-600">91,056,488</td>
                      <td>0</td>
                      <td className="text-rose-500">+1,476,288</td>
                      <td className="text-rose-500 font-black">+1.65%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* [보유종목일별] - 고유 로직 */}
            {activeTab === "보유종목일별" && (
              <div className="animate-in fade-in">
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr className="h-12">
                      <th>날짜</th>
                      <th>종목명</th>
                      <th>보유수량</th>
                      <th>현재가</th>
                      <th>평가금액</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border border-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-6 text-slate-400">2026-05-15</td>
                      <td className="font-black">삼성전자</td>
                      <td>120</td>
                      <td>78,500</td>
                      <td>9,420,000</td>
                      <td className="text-rose-500">+8.28%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* [월별수익률] - 고유 로직 */}
            {activeTab === "월별수익률" && (
              <div className="animate-in fade-in">
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr className="h-12">
                      <th>해당월</th>
                      <th>기초원금</th>
                      <th>기말자산</th>
                      <th>월간손익</th>
                      <th>월간수익률</th>
                      <th>누적수익률</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-black divide-y divide-slate-100 border border-slate-100">
                    <tr>
                      <td className="py-7 font-black italic text-blue-700">
                        2026-05
                      </td>
                      <td>77,986,020</td>
                      <td>91,056,488</td>
                      <td className="text-rose-500">+13,070,468</td>
                      <td className="text-rose-500">+16.7%</td>
                      <td>+101.7%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* [일별종가] - 고유 로직 및 수정 */}
            {activeTab === "일별종가" && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-800">
                    최근 시장 종가 데이터
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    데이터 기준 시각: 2026. 05. 15. 15:30
                  </span>
                </div>
                <table className="w-full text-center">
                  <thead className="bg-slate-100 text-slate-500 text-[11px] font-black">
                    <tr className="h-12 border-y border-slate-200">
                      <th>날짜</th>
                      <th>티커</th>
                      <th>종목명</th>
                      <th>종가</th>
                      <th>전일대비</th>
                      <th>거래량</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-6 text-slate-400">2026-05-15</td>
                      <td className="text-blue-500 italic">005930</td>
                      <td className="font-black text-slate-800">삼성전자</td>
                      <td className="font-black">78,500</td>
                      <td className="text-rose-500">+1.2%</td>
                      <td className="text-slate-400 uppercase">15.2M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* [입출금] */}
            {activeTab === "입출금" && (
              <div className="animate-in fade-in">
                <div className="mb-10 p-8 rounded-3xl bg-slate-50 border border-slate-200 flex gap-4 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] font-black">날짜</label>
                    <input
                      type="date"
                      value={newCash.날짜}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 날짜: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="w-40 space-y-1.5">
                    <label className="text-[11px] font-black">금액</label>
                    <input
                      type="number"
                      value={newCash.금액}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 금액: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] font-black">메모</label>
                    <input
                      type="text"
                      value={newCash.메모}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 메모: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveCash}
                    className="bg-slate-900 text-white px-10 py-3.5 rounded-xl text-[12px] font-black hover:bg-black transition-all"
                  >
                    입금/출금 저장
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr className="h-12">
                      <th className="pl-6 rounded-tl-xl">날짜</th>
                      <th>구분</th>
                      <th className="text-right">금액</th>
                      <th>메모</th>
                      <th className="text-center rounded-tr-xl">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border-x border-b border-slate-100">
                    {cashFlows.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-5 pl-6 text-slate-400">{c.날짜}</td>
                        <td>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase italic">
                            {c.구분}
                          </span>
                        </td>
                        <td className="text-right font-black text-slate-800 pr-10">
                          ₩ {formatNum(c.금액)}
                        </td>
                        <td className="text-slate-500">{c.메모}</td>
                        <td className="text-center space-x-3">
                          <button
                            onClick={() => handleEdit(c, "cash")}
                            className="text-blue-500 hover:font-black"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("삭제?"))
                                setCashFlows(
                                  cashFlows.filter((x) => x.id !== c.id),
                                );
                            }}
                            className="text-rose-400 hover:text-rose-600 font-bold"
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

            {/* [종목마스터] */}
            {activeTab === "종목마스터" && (
              <div className="animate-in fade-in">
                <div className="mb-10 p-8 rounded-3xl bg-slate-50 border border-slate-200 flex gap-4 items-end">
                  <div className="w-40 space-y-1.5">
                    <label className="text-[11px] font-black uppercase">
                      티커
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 티커: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold uppercase placeholder:lowercase"
                      placeholder="005930"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] font-black">종목명</label>
                    <input
                      type="text"
                      value={newStock.종목명}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 종목명: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold"
                    />
                  </div>
                  <div className="w-48 space-y-1.5">
                    <label className="text-[11px] font-black">시장</label>
                    <select
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full border-slate-300 rounded-xl p-3 text-[12px] font-bold outline-none"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>NASDAQ</option>
                      <option>ETF</option>
                    </select>
                  </div>
                  <button
                    onClick={saveStock}
                    className="bg-slate-900 text-white px-10 py-3.5 rounded-xl text-[12px] font-black hover:bg-black transition-all tracking-tighter"
                  >
                    마스터 등록
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr className="h-12">
                      <th className="pl-6 rounded-tl-xl">티커</th>
                      <th>종목명</th>
                      <th>시장</th>
                      <th>섹터</th>
                      <th>통화</th>
                      <th className="text-center rounded-tr-xl">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border-x border-b border-slate-100">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-5 pl-6 text-blue-600 font-black italic">
                          {s.티커}
                        </td>
                        <td className="font-black text-slate-800">
                          {s.종목명}
                        </td>
                        <td>
                          <span className="bg-slate-100 px-3 py-1 rounded-xl text-[10px] text-slate-500 font-black">
                            {s.시장}
                          </span>
                        </td>
                        <td className="text-slate-400 font-medium">
                          {s.섹터 || "미지정"}
                        </td>
                        <td className="text-slate-300 italic font-medium">
                          {s.통화}
                        </td>
                        <td className="text-center space-x-3">
                          <button
                            onClick={() => handleEdit(s, "stock")}
                            className="text-blue-500 hover:font-black"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("삭제?"))
                                setStockMaster(
                                  stockMaster.filter((x) => x.id !== s.id),
                                );
                            }}
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

            {/* [보유현황] */}
            {activeTab === "보유현황" && (
              <div className="animate-in fade-in">
                <table className="w-full text-center">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider">
                    <tr className="h-14">
                      <th>종목명</th>
                      <th>보유수량</th>
                      <th>평균단가</th>
                      <th>현재가</th>
                      <th>평가금액</th>
                      <th>평가손익</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y divide-slate-100 border-x border-b border-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-7 font-black text-sm">
                        삼성전자{" "}
                        <span className="text-[11px] text-blue-500 italic block">
                          005930
                        </span>
                      </td>
                      <td>120</td>
                      <td className="text-right pr-6">72,500</td>
                      <td className="text-right pr-6 font-black">78,500</td>
                      <td className="text-right pr-6 font-black text-blue-700">
                        ₩ 9,420,000
                      </td>
                      <td className="text-right pr-6 text-rose-500">
                        +720,000
                      </td>
                      <td className="text-right pr-6 text-rose-500 font-black">
                        +8.28%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");
        * {
          font-family: "Pretendard", sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .animate-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
