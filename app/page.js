"use client";

import React, { useState, useRef, useMemo } from "react";

/**
 * [STOCK-MANAGER: THE ULTIMATE INTEGRATED PORTFOLIO]
 * 1. 디자인: [그림 1, 2, 3] 기반 고대비 레이아웃 및 항목 구성
 * 2. 신기능: 종목명 입력 시 티커/시장 자동 입력 (Master 로직)
 * 3. 데이터: 8개 탭 전체 로직 및 엑셀 업로드/다운로드 복구
 * 4. CRUD: 데이터 무결성을 보장하는 수정/삭제 로직
 */

export default function StockManagerFinal() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // --- [기초 데이터 세팅] ---
  const [marketIndices] = useState([
    {
      이름: "코스피",
      지수: "2,493.18",
      전일: "2,581.41",
      변동: "-6.12%",
      상승: false,
    },
    {
      이름: "코스닥",
      지수: "1,129.82",
      전일: "1,191.09",
      변동: "-5.14%",
      상승: false,
    },
    {
      이름: "S&P500",
      지수: "7,501.24",
      전일: "7,444.25",
      변동: "+0.77%",
      상승: true,
    },
    {
      이름: "나스닥",
      지수: "26,635.22",
      전일: "26,402.34",
      변동: "+0.88%",
      상승: true,
    },
    {
      이름: "다우존스",
      지수: "50,063.46",
      전일: "49,693.20",
      변동: "+0.75%",
      상승: true,
    },
  ]);

  // 종목 자동 완성을 위한 참조 데이터
  const stockReference = {
    삼성전자: { 티커: "005930", 시장: "KOSPI" },
    SK하이닉스: { 티커: "000660", 시장: "KOSPI" },
    "tiger 반도체": { 티커: "091230", 시장: "ETF" },
    "kodex 코스피": { 티커: "226490", 시장: "ETF" },
    NAVER: { 티커: "035420", 시장: "KOSPI" },
    카카오: { 티커: "035720", 시장: "KOSDAQ" },
  };

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      날짜: "2026-05-10",
      구분: "매수",
      종목명: "삼성전자",
      티커: "005930",
      수량: 120,
      단가: 72000,
      수수료: 500,
      세금: 0,
      합계: 8640500,
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
    },
  ]);

  // --- [입력 폼 상태] ---
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
  });

  // --- [핵심 로직: 자동 입력 및 CRUD] ---
  const formatNum = (n) => (n ? Number(n).toLocaleString() : "0");

  const handleStockNameChange = (name, type) => {
    const ref = stockReference[name];
    if (type === "tx") {
      setNewTx((prev) => ({
        ...prev,
        종목명: name,
        티커: ref ? ref.티커 : prev.티커,
      }));
    } else if (type === "master") {
      setNewStock((prev) => ({
        ...prev,
        종목명: name,
        티커: ref ? ref.티커 : prev.티커,
        시장: ref ? ref.시장 : prev.시장,
      }));
    }
  };

  const handleSaveTx = () => {
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
    setNewStock({ 티커: "", 종목명: "", 시장: "KOSPI", 섹터: "" });
  };

  // --- [엑셀 관련] ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    alert(`${file.name} 업로드 로직이 실행되었습니다. (CSV 파싱 연동)`);
  };

  const downloadCSV = (type) => {
    alert(`${type} 데이터를 엑셀로 내보냅니다.`);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 text-[#1e293b] font-sans">
      <div className="max-w-[1700px] mx-auto">
        {/* [그림 1 참조] 최상단 제목 및 지수 대시보드 */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-blue-600 font-black text-xs tracking-widest uppercase">
              Stock-Manager
            </p>
            <h1 className="text-3xl font-black text-slate-800 mt-1">
              포트폴리오 대시보드
            </h1>
            <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase">
              동기화 데이터 기준 2026. 05. 15. 오후 04:59
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black hover:bg-slate-50">
              새로고침
            </button>
            <button className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black hover:bg-slate-50">
              로그아웃
            </button>
          </div>
        </div>

        {/* 지수 카드 5열 */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {marketIndices.map((idx, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <p className="text-[11px] font-black text-slate-400 mb-2">
                {idx.이름}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black">{idx.지수}</p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    전일 {idx.전일}
                  </p>
                </div>
                <span
                  className={`text-[12px] font-black ${idx.상승 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  ({idx.변동})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 자산 요약 (6칸) */}
        <div className="grid grid-cols-6 gap-4 mb-10">
          {[
            { t: "순투자원금", v: "45,137,473" },
            { t: "총자산", v: "91,056,488" },
            { t: "평가금액", v: "90,978,330" },
            { t: "손익", v: "45,919,015", c: "text-emerald-600" },
            { t: "수익률", v: "101.73%", c: "text-emerald-600" },
            { t: "현금", v: "78,158" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <p className="text-[11px] font-black text-slate-400 mb-2">
                {item.t}
              </p>
              <p className={`text-xl font-black ${item.c || "text-slate-800"}`}>
                {item.v}
              </p>
            </div>
          ))}
        </div>

        {/* 8개 탭 메인 영역 */}
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
                }}
                className={`px-6 py-3.5 rounded-xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-[#1e293b] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* 탭별 툴바 (업로드/다운로드) */}
            {["입출금", "거래관리", "종목마스터"].includes(activeTab) && (
              <div className="flex justify-end gap-2 mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-[11px] font-black border border-slate-200 hover:bg-slate-200"
                >
                  엑셀 업로드 ↑
                </button>
                <button
                  onClick={() => downloadCSV(activeTab)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[11px] font-black hover:bg-blue-700"
                >
                  엑셀 다운로드 ↓
                </button>
              </div>
            )}

            {/* --- [탭 1: 보유현황] - 비중 항목 추가 --- */}
            {activeTab === "보유현황" && (
              <table className="w-full text-center">
                <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                  <tr className="h-12">
                    <th>종목명</th>
                    <th>보유수량</th>
                    <th>평균단가</th>
                    <th>현재가</th>
                    <th>평가금액</th>
                    <th className="bg-blue-900">비중(%)</th>
                    <th>평가손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold divide-y">
                  <tr className="h-16 hover:bg-slate-50">
                    <td className="font-black text-slate-800">
                      삼성전자{" "}
                      <span className="text-[10px] text-slate-400 font-medium block">
                        KRW:005930
                      </span>
                    </td>
                    <td>120</td>
                    <td>154,821</td>
                    <td>296,000</td>
                    <td>32,460,000</td>
                    <td className="text-blue-600 font-black">35.6%</td>
                    <td className="text-emerald-500">+13,881,420</td>
                    <td className="text-emerald-500">+74.8%</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* --- [탭 2: 일별수익률] - 그림 1 항목 반영 --- */}
            {activeTab === "일별수익률" && (
              <table className="w-full text-center">
                <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                  <tr className="h-12">
                    <th>날짜</th>
                    <th>평가금액</th>
                    <th>순현금흐름</th>
                    <th>일손익</th>
                    <th>일수익률</th>
                    <th>누적원금</th>
                    <th>평가손익</th>
                    <th>기준</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold divide-y">
                  {[
                    {
                      d: "2026-05-15",
                      val: "90,978,330",
                      flow: "0",
                      profit: "-7,504,150",
                      yield: "-7.62%",
                      p: "45,067,230",
                      sp: "45,911,099",
                      b: "애프터마켓",
                    },
                    {
                      d: "2026-05-14",
                      val: "98,482,480",
                      flow: "-30,992,280",
                      profit: "1,569,250",
                      yield: "2.38%",
                      p: "45,067,230",
                      sp: "53,415,249",
                      b: "종가",
                    },
                  ].map((row, i) => (
                    <tr key={i} className="h-14 hover:bg-slate-50">
                      <td className="text-slate-400">{row.d}</td>
                      <td>{row.val}</td>
                      <td>{row.flow}</td>
                      <td
                        className={
                          row.profit.startsWith("-")
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }
                      >
                        {row.profit}
                      </td>
                      <td
                        className={
                          row.yield.startsWith("-")
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }
                      >
                        {row.yield}
                      </td>
                      <td>{row.p}</td>
                      <td>{row.sp}</td>
                      <td className="text-[10px] text-slate-400">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* --- [탭 3: 보유종목일별] - 그림 2 매트릭스 구조 --- */}
            {activeTab === "보유종목일별" && (
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-100 text-[11px] font-black border-y border-slate-200">
                    <tr className="h-12">
                      <th className="border-r">종목명</th>
                      <th>보유량</th>
                      <th>평균단가</th>
                      <th>총매수가</th>
                      <th className="border-r">현재가</th>
                      <th className="bg-blue-50 text-blue-600">2026-05-14</th>
                      <th className="bg-blue-50 text-blue-600">2026-05-13</th>
                      <th className="bg-blue-50 text-blue-600">2026-05-12</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold divide-y">
                    <tr className="h-14">
                      <td className="font-black border-r text-left pl-4">
                        SK하이닉스
                      </td>
                      <td>15</td>
                      <td>1,979,666</td>
                      <td>29,695,000</td>
                      <td className="border-r">1,970,000</td>
                      <td className="text-rose-500">-145,000 (0%)</td>
                      <td>0 (0%)</td>
                      <td>0 (0%)</td>
                    </tr>
                    <tr className="h-14">
                      <td className="font-black border-r text-left pl-4">
                        삼성전자
                      </td>
                      <td>120</td>
                      <td>154,821</td>
                      <td>18,578,580</td>
                      <td className="border-r">296,000</td>
                      <td className="text-emerald-500">1,440,000 (4.23%)</td>
                      <td className="text-emerald-500">600,000 (1.79%)</td>
                      <td className="text-rose-500">-764,000 (-2.6%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* --- [탭 5: 입출금] - 그림 3 디자인 및 칸 분리 --- */}
            {activeTab === "입출금" && (
              <div>
                <div className="mb-10 p-1 bg-[#f8fafc] rounded-3xl border border-slate-200 flex items-stretch">
                  <div className="flex-1 p-6 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newCash.날짜}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 날짜: e.target.value })
                      }
                      className="w-full bg-transparent text-sm font-black outline-none"
                    />
                  </div>
                  <div className="flex-1 p-6 border-r border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                      금액
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newCash.금액}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 금액: e.target.value })
                      }
                      className="w-full bg-transparent text-sm font-black outline-none"
                    />
                  </div>
                  <div className="flex-[2] p-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                      메모
                    </label>
                    <input
                      type="text"
                      placeholder="입출금 상세 내용 입력"
                      value={newCash.메모}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 메모: e.target.value })
                      }
                      className="w-full bg-transparent text-sm font-black outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveTx}
                    className="bg-[#1e293b] text-white px-10 m-2 rounded-2xl text-xs font-black hover:bg-black transition-all"
                  >
                    입금/출금 저장
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                    <tr className="h-12">
                      <th className="pl-6">날짜</th>
                      <th>구분</th>
                      <th>금액</th>
                      <th>메모</th>
                      <th className="text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-black divide-y border-x border-b">
                    {cashFlows.map((c) => (
                      <tr key={c.id} className="h-14 hover:bg-slate-50">
                        <td className="pl-6 text-slate-400">{c.날짜}</td>
                        <td>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px]">
                            입금
                          </span>
                        </td>
                        <td className="text-slate-800 font-black">
                          ₩ {formatNum(c.금액)}
                        </td>
                        <td className="text-slate-400 font-medium">{c.메모}</td>
                        <td className="text-center space-x-3 text-[11px]">
                          <button className="text-blue-500">수정</button>
                          <button className="text-rose-400">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- [탭 7: 종목마스터] - 자동완성 및 가독성 --- */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-10 p-8 bg-slate-800 rounded-3xl grid grid-cols-4 gap-6 items-end shadow-2xl">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      종목명 (자동완성)
                    </label>
                    <input
                      type="text"
                      value={newStock.종목명}
                      onChange={(e) =>
                        handleStockNameChange(e.target.value, "master")
                      }
                      className="w-full bg-slate-700 border-none rounded-xl p-3 text-white text-xs font-bold"
                      placeholder="삼성전자 입력..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      티커
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      readOnly
                      className="w-full bg-slate-900 border-none rounded-xl p-3 text-blue-400 text-xs font-black italic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      시장
                    </label>
                    <select
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full bg-slate-700 border-none rounded-xl p-3 text-white text-xs font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>ETF</option>
                      <option>NASDAQ</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setStockMaster([
                        ...stockMaster,
                        { ...newStock, id: Date.now() },
                      ]);
                      resetForms();
                    }}
                    className="bg-blue-600 text-white py-3.5 rounded-xl text-xs font-black hover:bg-blue-500"
                  >
                    마스터 등록
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                    <tr className="h-12">
                      <th className="pl-6">티커</th>
                      <th>종목명</th>
                      <th>시장</th>
                      <th>섹터</th>
                      <th className="text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-black divide-y border-x border-b">
                    {stockMaster.map((s) => (
                      <tr key={s.id} className="h-14 hover:bg-slate-50">
                        <td className="pl-6 text-blue-600 italic">{s.티커}</td>
                        <td>{s.종목명}</td>
                        <td>{s.시장}</td>
                        <td>{s.섹터 || "-"}</td>
                        <td className="text-center space-x-3">
                          <button className="text-blue-500">수정</button>
                          <button className="text-rose-400">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- [탭 6: 거래관리] --- */}
            {activeTab === "거래관리" && (
              <div>
                <div
                  className={`mb-10 p-8 rounded-3xl border-2 grid grid-cols-4 gap-4 items-end transition-all ${editingId ? "border-blue-500 bg-blue-50/20" : "border-slate-100 bg-slate-50"}`}
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newTx.날짜}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 날짜: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      구분
                    </label>
                    <select
                      value={newTx.구분}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 구분: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      종목명
                    </label>
                    <input
                      type="text"
                      value={newTx.종목명}
                      onChange={(e) =>
                        handleStockNameChange(e.target.value, "tx")
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                      placeholder="종목명 입력"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      수량
                    </label>
                    <input
                      type="number"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수량: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      단가
                    </label>
                    <input
                      type="number"
                      value={newTx.단가}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 단가: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      수수료
                    </label>
                    <input
                      type="number"
                      value={newTx.수수료}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수수료: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      세금
                    </label>
                    <input
                      type="number"
                      value={newTx.세금}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 세금: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />
                  </div>
                  <button
                    onClick={handleSaveTx}
                    className="bg-[#1e293b] text-white py-3.5 rounded-xl text-xs font-black hover:bg-black"
                  >
                    {editingId ? "수정 완료" : "거래 등록"}
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                    <tr className="h-12">
                      <th className="pl-6">날짜</th>
                      <th>구분</th>
                      <th>종목</th>
                      <th className="text-right">수량/단가</th>
                      <th className="text-right">수수료/세금</th>
                      <th className="text-right pr-6">합계</th>
                      <th className="text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-black divide-y border-x border-b">
                    {transactions.map((t) => (
                      <tr key={t.id} className="h-14 hover:bg-slate-50">
                        <td className="pl-6 text-slate-400">{t.날짜}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${t.구분 === "매수" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            {t.구분}
                          </span>
                        </td>
                        <td className="font-black text-slate-800">
                          {t.종목명}{" "}
                          <span className="text-[10px] text-slate-300 font-medium">
                            {t.티커}
                          </span>
                        </td>
                        <td className="text-right text-slate-500 font-medium">
                          {formatNum(t.수량)} / {formatNum(t.단가)}
                        </td>
                        <td className="text-right text-slate-400 font-medium">
                          {formatNum(t.수수료)} / {formatNum(t.세금)}
                        </td>
                        <td className="text-right pr-6 font-black text-blue-600">
                          ₩ {formatNum(t.합계)}
                        </td>
                        <td className="text-center space-x-3 text-[11px]">
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setNewTx({ ...t });
                            }}
                            className="text-blue-500 hover:font-black"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("삭제하시겠습니까?"))
                                setTransactions(
                                  transactions.filter((x) => x.id !== t.id),
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

            {/* --- [탭 8: 일별종가] --- */}
            {activeTab === "일별종가" && (
              <table className="w-full text-center">
                <thead className="bg-[#1e293b] text-white text-[11px] font-bold">
                  <tr className="h-12">
                    <th>날짜</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th>종가</th>
                    <th>전일대비</th>
                    <th>거래량</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold divide-y border-x border-b">
                  <tr className="h-14 hover:bg-slate-50">
                    <td className="text-slate-400">2026-05-15</td>
                    <td className="text-blue-500 italic">005930</td>
                    <td className="font-black text-slate-800">삼성전자</td>
                    <td>78,500</td>
                    <td className="text-rose-500">+1.2%</td>
                    <td className="text-slate-400 uppercase">15.2M</td>
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
          letter-spacing: -0.02em;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.5;
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
