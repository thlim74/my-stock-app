"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

/**
 * [STOCK-MANAGER ULTIMATE FINAL V39.6 - CRITICAL ERROR PATCHED PRODUCTION]
 * - [준수] 5대 기본 전제 최우선 적용 완료
 * - [해결] 거래내역 파싱 시 티커 누락으로 인한 'includes' undefined 오류 완벽 방어 처리 완료
 * - [보존] 디자인 절대 변경 금지 / 거래내역 내 수수료, 세금 항목 무삭제 유지
 * - [강화] 자료 업로드 시 티커 누락인 경우 자동 고유 티커 생성 처리 및 에러 핸들러 강화
 * - [방지] 컴포넌트 마운트/업데이트 시 로컬스토리지 안정적 보존 구조 확립 (데이터 삭제 방지)
 */

export default function StockManagerUltimateV39_6() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [errorMessage, setErrorMessage] = useState("");

  // --- [파일 업로드 및 입출력 참조 링크] ---
  const fileInputRef = useRef(null); // 상단 전체 JSON 백업 복구용
  const csvUploadRef = useRef(null); // 상단 전체 CSV 업로드용
  const tabCashCsvRef = useRef(null); // 입출금 탭 전용 CSV
  const tabTxCsvRef = useRef(null); // 거래관리 탭 전용 CSV
  const tabMasterCsvRef = useRef(null); // 종목마스터 탭 전용 CSV

  // --- [조회 기간 필터 초기 상태값] ---
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-18");

  // --- [기준 가격 및 실시간 틱 데이터] ---
  const baseTicks = {
    kospi: 7490.0,
    kosdaq: 1120.0,
    dow: 39500.0,
    nasdaq: 16300.0,
    sp500: 5200.0,
    exchangeRate: 1500.0,
  };

  const [liveTicks, setLiveTicks] = useState({
    kospi: 7492.49,
    kosdaq: 1122.57,
    dow: 39545.8,
    nasdaq: 16322.4,
    sp500: 5208.1,
    exchangeRate: 1501.2,
  });

  const defaultStockPrices = {
    "AMEX:FJET": 5.2,
    "AMEX:MWG": 2.5,
    "AMEX:SLV": 28.0,
    "AMEX:ULTY": 12.0,
    HCTI: 1.8,
    "000720": 32000,
    "011430": 21000,
    "002710": 55000,
    "003310": 2150,
    "005380": 240000,
    "0091P0": 14000,
    "009830": 26000,
    "0098F0": 11000,
    "010780": 28000,
    "012200": 2300,
    "014280": 4500,
    "015760": 22000,
    "005930": 73000,
    "000660": 181900,
  };

  const [liveStockPrices, setLiveStockPrices] = useState({
    ...defaultStockPrices,
  });

  // 4초 주기 실시간 난수 발생기
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicks((prev) => {
        const delta = (Math.random() - 0.5) * 10.0;
        return {
          kospi: +(prev.kospi + delta * 1.2).toFixed(2),
          kosdaq: +(prev.kosdaq + delta * 0.3).toFixed(2),
          dow: +(prev.dow + delta * 2.0).toFixed(2),
          nasdaq: +(prev.nasdaq + delta * 1.8).toFixed(2),
          sp500: +(prev.sp500 + delta * 0.6).toFixed(2),
          exchangeRate: +(
            prev.exchangeRate +
            (Math.random() - 0.5) * 1.0
          ).toFixed(2),
        };
      });

      setLiveStockPrices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((ticker) => {
          const isForeign =
            ticker && (ticker.includes(":") || ticker.startsWith("AUTO"));
          if (isForeign) {
            updated[ticker] = +(
              prev[ticker] +
              (Math.random() - 0.5) * 0.03
            ).toFixed(2);
          } else {
            updated[ticker] = Math.max(
              100,
              Math.round(prev[ticker] + (Math.random() - 0.5) * 150),
            );
          }
        });
        return updated;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const EXCHANGE_RATE = liveTicks.exchangeRate;

  const getDiffStr = (curr, base) => {
    const diff = curr - base;
    const pct = ((diff / base) * 100).toFixed(2);
    return diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`;
  };
  const isUp = (curr, base) => curr >= base;

  // 로컬 스토리지 키 명세 정의
  const STORAGE_KEYS = {
    TX: "ultimate_v39_6_tx_secured",
    CASH: "ultimate_v39_6_cash_secured",
    MASTER: "ultimate_v39_6_master_secured",
  };

  // --- [핵심 데이터 상태 컴포넌트] ---
  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [stockMaster, setStockMaster] = useState([
    {
      id: 1,
      티커: "AMEX:FJET",
      종목명: "스타파이터스 스페이스",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 2,
      티커: "AMEX:MWG",
      종목명: "멀티 웨이스 홀딩스",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 3,
      티커: "AMEX:SLV",
      종목명: "iShares Silver Trust",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 4,
      티커: "AMEX:ULTY",
      종목명: "ULTY ETF",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 5,
      티커: "HCTI",
      종목명: "헬스케어 트라이앵글",
      시장: "NASDAQ",
      섹터: "바이오/헬스케어",
    },
    {
      id: 6,
      티커: "000720",
      종목명: "현대건설",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 7,
      티커: "011430",
      종목명: "세아베스틸지주",
      시장: "KOSPI",
      섹터: "금융/지주사",
    },
    {
      id: 8,
      티커: "002710",
      종목명: "TCC스틸",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 9,
      티커: "003310",
      종목명: "대주산업",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 10,
      티커: "005380",
      종목명: "현대차",
      시장: "KOSPI",
      섹터: "전기차/자동차",
    },
    {
      id: 11,
      티커: "0091P0",
      종목명: "TIGER 코리아원자력",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 12,
      티커: "009830",
      종목명: "한화솔루션",
      시장: "KOSPI",
      섹터: "2차전지/친환경에너지",
    },
    {
      id: 13,
      티커: "0098F0",
      종목명: "KODEX K원자력SMR",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 14,
      티커: "010780",
      종목명: "아이에스동서",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 15,
      티커: "012200",
      종목명: "계양전기",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 16,
      티커: "014280",
      종목명: "금강공업",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 17,
      티커: "015760",
      종목명: "한국전력",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 18,
      티커: "005930",
      종목명: "삼성전자",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 19,
      티커: "000660",
      종목명: "SK하이닉스",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
  ]);

  const [isLoaded, setIsLoaded] = useState(false);
  const today = "2026-05-18";

  // --- [폼 데이터 관리 상태 객체] ---
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
    섹터: "일반제조/서비스",
  });
  const [manualPriceForm, setManualPriceForm] = useState({
    티커: "",
    가격: "",
  });

  // [전제 5 대응] 컴포넌트 최초 마운트 시에만 로컬스토리지에서 읽어와 상태를 세팅
  useEffect(() => {
    const savedTx = localStorage.getItem(STORAGE_KEYS.TX);
    const savedCash = localStorage.getItem(STORAGE_KEYS.CASH);
    const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedCash) setCashFlows(JSON.parse(savedCash));
    if (savedMaster) setStockMaster(JSON.parse(savedMaster));

    setIsLoaded(true);
  }, []);

  // [전제 5 대응] 로드 완료된 후, 내부 상태 변화 시에만 동기화하여 빈 배열 덮어쓰기 방지
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashFlows));
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(stockMaster));
  }, [transactions, cashFlows, stockMaster, isLoaded]);

  const formatNum = (n) => (n ? Math.round(Number(n)).toLocaleString() : "0");
  const formatFloat = (n) =>
    n
      ? Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  const parseCleanNum = (val) => {
    if (typeof val === "number") return val;
    if (!val || val === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  const getMarketByStockName = (name) => {
    const found = stockMaster.find((s) => s.종목명 === name);
    return found ? found.시장 : "KOSPI";
  };

  // ==========================================
  // 전체 JSON 백업 및 안전 복구 엔진
  // ==========================================
  const handleDownloadBackup = () => {
    const backupData = {
      transactions,
      cashFlows,
      stockMaster,
      exportedAt: new Date().toISOString(),
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `stock_manager_backup_${today}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.transactions || !parsed.cashFlows || !parsed.stockMaster) {
          throw new Error("필수 백업 데이터 노드가 누락되었습니다.");
        }
        if (
          confirm(
            "⚠️ 기존 로컬 데이터 내역을 파기하고 백업본으로 전체 복구합니까?",
          )
        ) {
          setTransactions(parsed.transactions);
          setCashFlows(parsed.cashFlows);
          setStockMaster(parsed.stockMaster);
          setErrorMessage("");
          alert("성공적으로 전체 백업 데이터가 라이브 복구되었습니다.");
        }
      } catch (err) {
        setErrorMessage(`백업 복구 실패: ${err.message}`);
        alert(`[오류 발생] ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ==========================================
  // 상단 통합 매매 내역 CSV 양식 다운로드
  // ==========================================
  const handleDownloadTemplate = () => {
    const headers = [
      "구분(매수/매도)",
      "날짜(YYYY-MM-DD)",
      "종목명",
      "티커코드",
      "수량",
      "단가",
      "수수료",
      "세금",
    ];
    const rows = [
      ["매수", "2026-05-18", "삼성전자", "005930", "10", "73000", "0", "0"],
      ["매수", "2026-05-18", "신규테스트종목", "", "5", "12.50", "10", "5"], // 전제 4 확인용 티커 빈값 예시
    ];
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "통합매매내역_일괄등록_양식.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ==========================================
  // [전제 4 규격 구현] 상단 통합 CSV 파일 업로드 분석 엔진
  // ==========================================
  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setErrorMessage("");
        const text = event.target.result;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        if (lines.length <= 1) {
          throw new Error("파싱할 행 데이터가 없거나 파일이 비어있습니다.");
        }

        const list = [];
        const masterTokens = [];
        let errorLines = [];

        for (let i = 1; i < lines.length; i++) {
          const r = lines[i].split(",").map((c) => c.trim());
          if (r.length < 4) {
            errorLines.push(`${i + 1}라인: 열 부족 (데이터 불완전)`);
            continue;
          }

          let gubun = r[0];
          let date = r[1];
          let name = r[2];
          let ticker = r[3] || ""; // undefined 방지
          let qty = Number(r[4]) || 0;
          let price = Number(r[5]) || 0;
          let fee = Number(r[6]) || 0; // 수수료 유지
          let tax = Number(r[7]) || 0; // 세금 유지

          if (!gubun || !date || !name) {
            errorLines.push(
              `${i + 1}라인: 필수 입력값(구분, 날짜, 종목명) 누락`,
            );
            continue;
          }

          // [전제 4] 티커가 없는 경우 자동 생성 메커니즘 활성화
          if (!ticker || ticker === "") {
            const existing = stockMaster.find((s) => s.종목명 === name);
            if (existing) {
              ticker = existing.티커;
            } else {
              const hashId = Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();
              ticker = `AUTO_${hashId}`;
            }
          }

          // 종목 마스터 등록 여부 크로스체크 및 동적 등록 리스트 축적
          const masterExists =
            stockMaster.some((s) => s.티커 === ticker) ||
            masterTokens.some((m) => m.티커 === ticker);
          if (!masterExists) {
            const calculatedMarket =
              ticker.includes(":") || ticker.startsWith("AUTO")
                ? "NASDAQ"
                : "KOSPI";
            masterTokens.push({
              id: Date.now() + i + 800,
              티커: ticker,
              종목명: name,
              시장: calculatedMarket,
              섹터: "일반제조/서비스",
            });
          }

          const mkt =
            ticker.includes(":") || ticker.startsWith("AUTO")
              ? "NASDAQ"
              : "KOSPI";
          const tot =
            gubun === "매수"
              ? mkt === "NASDAQ"
                ? qty * price * EXCHANGE_RATE + fee + tax
                : qty * price + fee + tax
              : mkt === "NASDAQ"
                ? qty * price * EXCHANGE_RATE - fee - tax
                : qty * price - fee - tax;

          list.push({
            id: Date.now() + i,
            날짜: date,
            구분: gubun,
            종목명: name,
            티커: ticker,
            시장: mkt,
            수량: qty,
            단가: price,
            수수료: fee,
            세금: tax,
            합계: tot,
          });
        }

        if (errorLines.length > 0) {
          const errMsg = `[일부 업로드 제외 알림]\n` + errorLines.join("\n");
          setErrorMessage(errMsg);
          alert(errMsg);
        }

        if (list.length > 0) {
          if (
            confirm(
              `자동 생성/매핑된 데이터 포함 총 ${list.length}건의 데이터를 병합 업로드 하시겠습니까?`,
            )
          ) {
            if (masterTokens.length > 0)
              setStockMaster((p) => [...p, ...masterTokens]);
            setTransactions((p) => [...list, ...p]);
          }
        } else {
          alert("업로드할 수 있는 올바른 행 데이터 레코드가 없습니다.");
        }
      } catch (err) {
        setErrorMessage(`통합 CSV 로드 치명적 파싱 에러: ${err.message}`);
        alert(`[CSV 업로드 중단 에러 발생] ${err.message}`);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // ==========================================
  // 개별 탭 전용 엑셀(CSV) 다운로드/업로드 파서 핸들러
  // ==========================================

  // 1. 입출금 전용
  const handleDownloadCashCsv = () => {
    const headers = [
      "날짜(YYYY-MM-DD)",
      "구분(입금/출금)",
      "금액(원화)",
      "메모",
    ];
    const dataRows =
      cashFlows.length > 0
        ? cashFlows.map((c) => [c.날짜, c.구분, c.금액, c.메모 || ""])
        : [["2026-05-18", "입금", "5000000", "초기투자 자본금"]];
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...dataRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `입출금내역_export_${today}.csv`;
    link.click();
  };

  const handleUploadCashCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (el) => {
      try {
        setErrorMessage("");
        const lines = el.target.result
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        const list = [];
        for (let i = 1; i < lines.length; i++) {
          const r = lines[i].split(",").map((c) => c.trim());
          if (r.length < 3) continue;
          list.push({
            id: Date.now() + i,
            날짜: r[0],
            구분: r[1],
            금액: Number(r[2]) || 0,
            메모: r[3] || "",
          });
        }
        if (
          list.length > 0 &&
          confirm(`총 ${list.length}건의 현금 흐름을 업로드 병합합니까?`)
        ) {
          setCashFlows((p) => [...list, ...p]);
        }
      } catch (err) {
        setErrorMessage(`입출금 파싱 에러: ${err.message}`);
        alert("입출금 파싱 에러: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // 2. 거래관리 전용 (수수료, 세금 100% 필수 포함 유지 및 'includes' 오류 원천 방어)
  const handleDownloadTxCsv = () => {
    const headers = [
      "구분",
      "날짜",
      "종목명",
      "티커",
      "수량",
      "단가",
      "수수료",
      "세금",
    ];
    const dataRows =
      transactions.length > 0
        ? transactions.map((t) => [
            t.구분,
            t.날짜,
            t.종목명,
            t.티커,
            t.수량,
            t.단가,
            t.수수료,
            t.세금,
          ])
        : [
            [
              "매수",
              "2026-05-18",
              "삼성전자",
              "005930",
              "5",
              "73000",
              "0",
              "0",
            ],
          ];
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...dataRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `매매거래내역_export_${today}.csv`;
    link.click();
  };

  const handleUploadTxCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (el) => {
      try {
        setErrorMessage("");
        const lines = el.target.result
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        const list = [];
        const masterTokens = [];

        for (let i = 1; i < lines.length; i++) {
          const r = lines[i].split(",").map((c) => c.trim());
          if (r.length < 3) continue;

          let gubun = r[0];
          let date = r[1];
          let name = r[2];
          let ticker = r[3] || ""; // [핵심 패치] undefined인 경우 안전하게 빈 문자열 치환
          let qty = Number(r[4]) || 0;
          let price = Number(r[5]) || 0;
          let fee = Number(r[6]) || 0; // 수수료 보존
          let tax = Number(r[7]) || 0; // 세금 보존

          // [전제 4 예외 대응] 티커코드 미입력 시 자동 고유식별 부여
          if (!ticker || ticker === "") {
            const existing = stockMaster.find((s) => s.종목명 === name);
            ticker = existing
              ? existing.티커
              : `AUTO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          }

          if (
            !stockMaster.some((sm) => sm.티커 === ticker) &&
            !masterTokens.some((mt) => mt.티커 === ticker)
          ) {
            masterTokens.push({
              id: Date.now() + i + 950,
              티커: ticker,
              종목명: name,
              시장:
                ticker.includes(":") || ticker.startsWith("AUTO")
                  ? "NASDAQ"
                  : "KOSPI",
              섹터: "일반제조/서비스",
            });
          }

          const mkt =
            ticker.includes(":") || ticker.startsWith("AUTO")
              ? "NASDAQ"
              : "KOSPI";
          const tot =
            gubun === "매수"
              ? mkt === "NASDAQ"
                ? qty * price * EXCHANGE_RATE + fee + tax
                : qty * price + fee + tax
              : mkt === "NASDAQ"
                ? qty * price * EXCHANGE_RATE - fee - tax
                : qty * price - fee - tax;

          list.push({
            id: Date.now() + i,
            구분: gubun,
            날짜: date,
            종목명: name,
            티커: ticker,
            시장: mkt,
            수량: qty,
            단가: price,
            수수료: fee,
            세금: tax,
            합계: tot,
          });
        }
        if (
          list.length > 0 &&
          confirm(`총 ${list.length}건의 거래 내역을 병합합니까?`)
        ) {
          if (masterTokens.length > 0)
            setStockMaster((p) => [...p, ...masterTokens]);
          setTransactions((p) => [...list, ...p]);
        }
      } catch (err) {
        setErrorMessage(`거래내역 파싱 에러: ${err.message}`);
        alert("거래내역 파싱 에러: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // 3. 종목마스터 전용
  const handleDownloadMasterCsv = () => {
    const headers = ["티커코드", "종목명", "시장분류", "섹터분류"];
    const dataRows = stockMaster.map((s) => [
      s.티커,
      s.종목명,
      s.시장,
      s.섹터 || "일반제조/서비스",
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...dataRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `종목마스터_export_${today}.csv`;
    link.click();
  };

  const handleUploadMasterCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (el) => {
      try {
        setErrorMessage("");
        const lines = el.target.result
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        const tokens = [];
        for (let i = 1; i < lines.length; i++) {
          const r = lines[i].split(",").map((c) => c.trim());
          if (r.length < 2) continue;
          let ticker = r[0] || "";
          let name = r[1];
          if (!ticker || ticker === "") {
            ticker = `AUTO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          }
          if (!stockMaster.some((sm) => sm.티커 === ticker)) {
            tokens.push({
              id: Date.now() + i,
              티커: ticker,
              종목명: name,
              시장: r[2] || "KOSPI",
              섹터: r[3] || "일반제조/서비스",
            });
          }
        }
        if (
          tokens.length > 0 &&
          confirm(
            `새로운 종목 마스터 ${tokens.length}개를 리스트에 추가합니까?`,
          )
        ) {
          setStockMaster((p) => [...p, ...tokens]);
        } else {
          alert(
            "추가할 신규 고유 종목이 없거나 형식에 맞는 데이터가 존재하지 않습니다.",
          );
        }
      } catch (err) {
        setErrorMessage(`종목마스터 파싱 에러: ${err.message}`);
        alert("종목마스터 파싱 에러: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // --- [계산 집계 메인 프레임 모델링 모듈] ---
  const stats = useMemo(() => {
    let netInvestment = 0;
    let cashBalance = 0;

    cashFlows.forEach((c) => {
      const amt = Number(c.금액) || 0;
      if (c.구분 === "입금") {
        netInvestment += amt;
        cashBalance += amt;
      } else {
        netInvestment -= amt;
        cashBalance -= amt;
      }
    });

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.날짜) - new Date(b.날짜),
    );
    const holdingMap = {};
    let totalRealizedProfit = 0;

    sortedTx.forEach((tx) => {
      const name = tx.종목명;
      const q = Number(tx.수량) || 0;
      const p = Number(tx.단가) || 0;
      const f = Number(tx.수수료) || 0; // 수수료 항목 변산 유지
      const t = Number(tx.세금) || 0; // 세금 항목 변산 유지

      const isForeign =
        tx.시장 === "NASDAQ" ||
        tx.시장 === "NYSE" ||
        (tx.티커 && (tx.티커.includes(":") || tx.티커.startsWith("AUTO")));
      const totalKrw =
        tx.구분 === "매수"
          ? isForeign
            ? q * p * EXCHANGE_RATE + f + t
            : q * p + f + t
          : isForeign
            ? q * p * EXCHANGE_RATE - f - t
            : q * p - f - t;

      if (!holdingMap[name]) {
        holdingMap[name] = {
          종목명: name,
          티커: tx.티커 || "999999",
          시장: tx.시장 || "KOSPI",
          보유량: 0,
          총매입금액달러: 0,
          총매입금액원화: 0,
          실현손익원화: 0,
          최근단가: p,
        };
      }

      const h = holdingMap[name];
      if (tx.구분 === "매수") {
        cashBalance -= totalKrw;
        h.보유량 += q;
        if (isForeign) h.총매입금액달러 += q * p;
        h.총매입금액원화 += totalKrw;
      } else {
        cashBalance += totalKrw;
        const avgPriceKrw = h.보유량 > 0 ? h.총매입금액원화 / h.보유량 : 0;
        const realizedKrw = totalKrw - q * avgPriceKrw;
        totalRealizedProfit += realizedKrw;
        h.실현손익원화 += realizedKrw;

        if (isForeign) {
          const avgPriceUsd = h.보유량 > 0 ? h.총매입금액달러 / h.보유량 : 0;
          h.총매입금액달러 -= q * avgPriceUsd;
        }
        h.총매입금액원화 -= q * avgPriceKrw;
        h.보유량 -= q;
      }
      h.최근단가 = p;
    });

    const sectorWeightsMap = {};

    const holdingList = Object.values(holdingMap)
      .filter((h) => h.보유량 > 0)
      .map((h) => {
        const isForeign =
          h.시장 === "NASDAQ" ||
          h.시장 === "NYSE" ||
          (h.티커 && (h.티커.includes(":") || h.티커.startsWith("AUTO")));
        const currentPrice =
          liveStockPrices[h.티커] !== undefined
            ? liveStockPrices[h.티커]
            : h.최근단가;

        let avgPrice = 0;
        let evalAmtKrw = 0;
        let profitKrw = 0;

        if (isForeign) {
          avgPrice = h.총매입금액달러 / h.보유량;
          evalAmtKrw = h.보유량 * currentPrice * EXCHANGE_RATE;
        } else {
          avgPrice = h.총매입금액원화 / h.보유량;
          evalAmtKrw = h.보유량 * currentPrice;
        }
        profitKrw = evalAmtKrw - h.총매입금액원화;

        const mMatch = stockMaster.find((sm) => sm.티커 === h.티커);
        const sectorName = mMatch ? mMatch.섹터 : "일반제조/서비스";
        sectorWeightsMap[sectorName] =
          (sectorWeightsMap[sectorName] || 0) + evalAmtKrw;

        return {
          종목명: h.종목명,
          티커: h.티커,
          시장: h.시장,
          보유량: h.보유량,
          섹터: sectorName,
          평균단가: avgPrice,
          현재가: currentPrice,
          평가금액: Math.round(evalAmtKrw),
          손익: Math.round(profitKrw),
          수익률:
            h.총매입금액원화 > 0
              ? ((profitKrw / h.총매입금액원화) * 100).toFixed(2) + "%"
              : "0.00%",
        };
      });

    const totalEvaluation = holdingList.reduce(
      (acc, cur) => acc + cur.평가금액,
      0,
    );
    const totalAsset = totalEvaluation + cashBalance;
    const totalProfitRate =
      netInvestment > 0
        ? ((totalAsset - netInvestment) / netInvestment) * 100
        : 0;

    // 시계열 트래킹 연산 바인딩
    const rawDates = Array.from(
      new Set([
        ...transactions.map((t) => t.날짜),
        ...cashFlows.map((c) => c.날짜),
        "2026-05-01",
        today,
      ]),
    ).sort((a, b) => new Date(a.날짜) - new Date(b.날짜));

    const dailyList = [];
    let assetChangeDoD = 0;
    let assetChangeRateDoD = 0;

    if (rawDates.length > 0) {
      const firstDate = new Date(rawDates[0]);
      const lastDate = new Date(today);
      const allDatesArray = [];
      let currentLoopDate = new Date(firstDate);
      while (currentLoopDate <= lastDate) {
        allDatesArray.push(currentLoopDate.toISOString().split("T")[0]);
        currentLoopDate.setDate(currentLoopDate.getDate() + 1);
      }

      let runInvest = 0,
        runCash = 0;
      const runHoldings = {};

      allDatesArray.forEach((date) => {
        cashFlows
          .filter((c) => c.날짜 === date)
          .forEach((c) => {
            const amt = Number(c.금액) || 0;
            if (c.구분 === "입금") {
              runInvest += amt;
              runCash += amt;
            } else {
              runInvest -= amt;
              runCash -= amt;
            }
          });

        transactions
          .filter((t) => t.날짜 === date)
          .forEach((tx) => {
            const name = tx.종목명;
            const q = Number(tx.수량) || 0,
              p = Number(tx.단가) || 0;
            const f = Number(tx.수수료) || 0,
              t = Number(tx.세금) || 0;
            const isForeign =
              tx.시장 === "NASDAQ" ||
              tx.시장 === "NYSE" ||
              (tx.티커 &&
                (tx.티커.includes(":") || tx.티커.startsWith("AUTO")));
            const tot =
              tx.구분 === "매수"
                ? isForeign
                  ? q * p * EXCHANGE_RATE + f + t
                  : q * p + f + t
                : isForeign
                  ? q * p * EXCHANGE_RATE - f - t
                  : q * p - f - t;

            if (!runHoldings[name]) {
              runHoldings[name] = {
                qty: 0,
                totalCostKrw: 0,
                currentPrice: p,
                isForeign,
                ticker: tx.티커,
              };
            }
            if (tx.구분 === "매수") {
              runCash -= tot;
              runHoldings[name].qty += q;
              runHoldings[name].totalCostKrw += tot;
            } else {
              runCash += tot;
              const avgKrw =
                runHoldings[name].qty > 0
                  ? runHoldings[name].totalCostKrw / runHoldings[name].qty
                  : 0;
              runHoldings[name].totalCostKrw -= q * avgKrw;
              runHoldings[name].qty -= q;
            }
            runHoldings[name].currentPrice = p;
          });

        let dayEval = 0;
        Object.keys(runHoldings).forEach((k) => {
          if (runHoldings[k].qty > 0) {
            const h = runHoldings[k];
            const dynamicPrice =
              date === today
                ? liveStockPrices[h.ticker] || h.currentPrice
                : h.currentPrice;
            dayEval += h.isForeign
              ? h.qty * dynamicPrice * EXCHANGE_RATE
              : h.qty * dynamicPrice;
          }
        });

        const dayAsset = dayEval + runCash;
        const dayProfit = dayAsset - runInvest;
        dailyList.push({
          날짜: date,
          평가금액: Math.round(dayAsset),
          일손익: Math.round(dayProfit),
          일수익률:
            runInvest > 0
              ? ((dayProfit / runInvest) * 100).toFixed(2) + "%"
              : "0.00%",
          누적원금: Math.round(runInvest),
        });
      });

      if (dailyList.length >= 2) {
        const todaySnap = dailyList[dailyList.length - 1];
        const yesterdaySnap = dailyList[dailyList.length - 2];
        assetChangeDoD = todaySnap.평가금액 - yesterdaySnap.평가금액;
        assetChangeRateDoD =
          yesterdaySnap.평가금액 > 0
            ? (assetChangeDoD / yesterdaySnap.평가금액) * 100
            : 0;
      }
    }

    const monthlyMap = {};
    dailyList.forEach((d) => {
      monthlyMap[d.날짜.substring(0, 7)] = d;
    });
    const monthlyList = Object.keys(monthlyMap)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        const mData = monthlyMap[m];
        return {
          해당월: m,
          기말자산: mData.평가금액,
          순입출금: mData.누적원금,
          월간손익: mData.일손익,
          수익률:
            mData.누적원금 > 0
              ? ((mData.일손익 / mData.누적원금) * 100).toFixed(2) + "%"
              : "0.00%",
        };
      });

    const sectorWeights = Object.keys(sectorWeightsMap)
      .map((sName) => {
        const amt = sectorWeightsMap[sName];
        return {
          name: sName,
          amount: amt,
          percentage:
            totalEvaluation > 0
              ? ((amt / totalEvaluation) * 100).toFixed(1)
              : "0.0",
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      holdingList,
      netInvestment,
      totalAsset,
      totalRealizedProfit,
      totalEvaluation,
      totalProfitRate,
      cashBalance,
      dailyList,
      monthlyList,
      allDates: dailyList.map((d) => d.날짜),
      assetChangeDoD,
      assetChangeRateDoD,
      sectorWeights,
    };
  }, [transactions, cashFlows, EXCHANGE_RATE, liveStockPrices, stockMaster]);

  // 가로 전개 피벗 매트릭스 인메모리 핵심 가동 엔진
  const pivotData = useMemo(() => {
    const filteredDates = stats.allDates
      .filter((d) => d >= startDate && d <= endDate)
      .sort((a, b) => b.localeCompare(a));
    const sortedTx = [...transactions].sort((a, b) =>
      a.날짜.localeCompare(b.날짜),
    );
    const matrix = {};
    stockMaster.forEach((s) => {
      matrix[s.종목명] = {
        종목명: s.종목명,
        티커: s.티커,
        시장: s.시장,
        역사적내역: {},
      };
    });

    const trackingHoldings = {};
    stockMaster.forEach((s) => {
      trackingHoldings[s.종목명] = { qty: 0, totalCostUsd: 0, totalCostKrw: 0 };
    });

    stats.allDates.forEach((date) => {
      sortedTx
        .filter((t) => t.날짜 === date)
        .forEach((tx) => {
          const th = trackingHoldings[tx.종목명];
          if (!th) return;
          const isForeign =
            tx.시장 === "NASDAQ" ||
            tx.시장 === "NYSE" ||
            (tx.티커 && (tx.티커.includes(":") || tx.티커.startsWith("AUTO")));
          const txTotalKrw =
            tx.구분 === "매수"
              ? isForeign
                ? tx.수량 * tx.단가 * EXCHANGE_RATE + tx.수수료 + tx.세금
                : tx.수량 * tx.단가 + tx.수수료 + tx.세금
              : isForeign
                ? tx.수량 * tx.단가 * EXCHANGE_RATE - tx.수수료 - tx.세금
                : tx.수량 * tx.단가 - tx.수수료 - tx.세금;

          if (tx.구분 === "매수") {
            th.qty += tx.수량;
            if (isForeign) th.totalCostUsd += tx.수량 * tx.단가;
            th.totalCostKrw += txTotalKrw;
          } else {
            const avgUsd = th.qty > 0 ? th.totalCostUsd / th.qty : 0;
            const avgKrw = th.qty > 0 ? th.totalCostKrw / th.qty : 0;
            th.totalCostUsd -= tx.수량 * avgUsd;
            th.totalCostKrw -= tx.수량 * avgKrw;
            th.qty -= tx.수량;
          }
        });

      Object.keys(trackingHoldings).forEach((name) => {
        if (!matrix[name]) return;
        const th = trackingHoldings[name];
        const isForeign =
          matrix[name].시장 === "NASDAQ" ||
          matrix[name].시장 === "NYSE" ||
          (matrix[name].티커 &&
            (matrix[name].티커.includes(":") ||
              matrix[name].티커.startsWith("AUTO")));
        if (th.qty > 0) {
          const avgPrice = isForeign
            ? th.totalCostUsd / th.qty
            : th.totalCostKrw / th.qty;
          const livePrice = liveStockPrices[matrix[name].티커] || avgPrice;
          const livePriceKrw = isForeign
            ? livePrice * EXCHANGE_RATE
            : livePrice;
          const dailyCostKrw = th.totalCostKrw;
          const dailyEvalKrw = th.qty * livePriceKrw;
          const dailyProfitKrw = dailyEvalKrw - dailyCostKrw;
          matrix[name].역사적내역[date] = {
            qty: th.qty,
            avgPrice,
            totalCost: dailyCostKrw,
            profit: dailyProfitKrw,
            rate: dailyCostKrw > 0 ? (dailyProfitKrw / dailyCostKrw) * 100 : 0,
          };
        }
      });
    });

    const finalRows = Object.values(matrix).filter((row) =>
      filteredDates.some((d) => row.역사적내역[d] !== undefined),
    );
    const dailyColumnTotals = {};
    filteredDates.forEach((d) => {
      let sumProfit = 0,
        sumCost = 0;
      finalRows.forEach((row) => {
        const snap = row.역사적내역[d];
        if (snap) {
          sumProfit += snap.profit;
          sumCost += snap.totalCost;
        }
      });
      dailyColumnTotals[d] = {
        profit: sumProfit,
        rate: sumCost > 0 ? (sumProfit / sumCost) * 100 : 0,
      };
    });
    return { finalRows, filteredDates, dailyColumnTotals };
  }, [
    stats.allDates,
    transactions,
    stockMaster,
    liveStockPrices,
    EXCHANGE_RATE,
    startDate,
    endDate,
  ]);

  const activeHoldingQuantities = useMemo(() => {
    const map = {};
    stats.holdingList.forEach((h) => {
      map[h.종목명] = h.보유량;
    });
    return map;
  }, [stats.holdingList]);

  // --- [인터랙션 CRUD 제어 시스템 그룹] ---
  const triggerEditTx = (item) => {
    setEditingId(item.id);
    setNewTx({
      날짜: item.날짜,
      구분: item.구분,
      종목명: item.종목명,
      티커: item.티커,
      수량: String(item.수량),
      단가: String(item.단가),
      수수료: String(item.수수료),
      세금: String(item.세금),
    });
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleApplyManualPrice = () => {
    if (!manualPriceForm.티커 || !manualPriceForm.가격) {
      alert("종목코드와 가격을 확인하세요.");
      return;
    }
    setLiveStockPrices((prev) => ({
      ...prev,
      [manualPriceForm.티커]: Number(manualPriceForm.가격),
    }));
    setManualPriceForm({ 티커: "", 가격: "" });
  };

  const saveTx = () => {
    setErrorMessage("");
    if (!newTx.종목명) {
      setErrorMessage("종목 데이터 식별 불가.");
      return;
    }
    const q = parseCleanNum(newTx.수량),
      p = parseCleanNum(newTx.단가),
      f = parseCleanNum(newTx.수수료),
      t = parseCleanNum(newTx.세금);
    let currentTicker = newTx.티커 ? newTx.티커.trim() : "999999";
    let detectedMarket = getMarketByStockName(newTx.종목명);

    const isForeign =
      detectedMarket === "NASDAQ" ||
      detectedMarket === "NYSE" ||
      currentTicker.includes(":") ||
      currentTicker.startsWith("AUTO");
    const totalKrw =
      newTx.구분 === "매수"
        ? isForeign
          ? q * p * EXCHANGE_RATE + f + t
          : q * p + f + t
        : isForeign
          ? q * p * EXCHANGE_RATE - f - t
          : q * p - f - t;

    const data = {
      ...newTx,
      id: editingId || Date.now(),
      티커: currentTicker,
      시장: detectedMarket,
      수량: q,
      단가: p,
      수수료: f,
      세금: t,
      합계: totalKrw,
    };
    if (editingId)
      setTransactions(
        transactions.map((item) => (item.id === editingId ? data : item)),
      );
    else setTransactions([data, ...transactions]);
    resetForms();
  };

  const saveCash = () => {
    const amt = parseCleanNum(newCash.금액);
    if (amt <= 0) return;
    setCashFlows([{ ...newCash, id: Date.now(), 금액: amt }, ...cashFlows]);
    resetForms();
  };

  const saveMaster = () => {
    if (!newStock.종목명) return;
    let targetTicker = newStock.티커 ? newStock.티커.trim() : "";
    if (targetTicker === "") {
      targetTicker = `AUTO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
    setStockMaster([
      ...stockMaster,
      { ...newStock, 티커: targetTicker, id: Date.now() },
    ]);
    resetForms();
  };

  const deleteItem = (id) => {
    if (!confirm("선택하신 원천 레코드를 파기하시겠습니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => t.id !== id));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => c.id !== id));
    if (activeTab === "종목마스터")
      setStockMaster(stockMaster.filter((s) => s.id !== id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
    );
  };

  const handleSelectAllToggle = () => {
    const targets =
      activeTab === "거래관리"
        ? transactions.map((t) => t.id)
        : cashFlows.map((c) => c.id);
    if (targets.every((id) => selectedIds.includes(id))) {
      setSelectedIds((p) => p.filter((id) => !targets.includes(id)));
    } else {
      setSelectedIds((p) => Array.from(new Set([...p, ...targets])));
    }
  };

  const deleteSelected = () => {
    if (!confirm("선택 항목을 일괄 파기합니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => !selectedIds.includes(t.id)));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => !selectedIds.includes(c.id)));
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
    setNewStock({
      티커: "",
      종목명: "",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* 상단 통합 제어 대시바 */}
        <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              📊 STOCK-MANAGER ULTIMATE V39.6
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              5대 핵심 전제 보완 탑재 적용 완료 (티커 미지정 예외 에러 완벽
              해결)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all"
            >
              📥 통합 일괄양식(.CSV) 받기
            </button>
            <button
              onClick={() => csvUploadRef.current.click()}
              className="text-[11px] font-black bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              🚀 통합 엑셀(.CSV) 대량 업로드
            </button>
            <button
              onClick={handleDownloadBackup}
              className="text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 transition-all"
            >
              💾 전체 데이터 백업 (JSON)
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-[11px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-3 py-2 rounded-xl hover:bg-amber-100 transition-all"
            >
              📂 전체 백업 복구 (JSON)
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadBackup}
              accept=".json"
              className="hidden"
            />
            <input
              type="file"
              ref={csvUploadRef}
              onChange={handleUploadCSV}
              accept=".csv"
              className="hidden"
            />
            <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-2 rounded-xl ml-2">
              Live: {lastUpdate}
            </span>
          </div>
        </div>

        {/* [전제 4 피드백 메커니즘] 에러 보드 공출 프레임 */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-[12px] font-bold whitespace-pre-line animate-pulse">
            ⚠️ <b>[데이터 동기화 및 파싱 분석 로그]</b> <br />
            {errorMessage}
          </div>
        )}

        {/* 실시간 지수 인덱스 현황 */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {[
            {
              n: "KOSPI 지수",
              v: liveTicks.kospi.toLocaleString(),
              d: getDiffStr(liveTicks.kospi, baseTicks.kospi),
              up: isUp(liveTicks.kospi, baseTicks.kospi),
            },
            {
              n: "KOSDAQ 지수",
              v: liveTicks.kosdaq.toLocaleString(),
              d: getDiffStr(liveTicks.kosdaq, baseTicks.kosdaq),
              up: isUp(liveTicks.kosdaq, baseTicks.kosdaq),
            },
            {
              n: "다우존스 지수",
              v: liveTicks.dow.toLocaleString(),
              d: getDiffStr(liveTicks.dow, baseTicks.dow),
              up: isUp(liveTicks.dow, baseTicks.dow),
            },
            {
              n: "나스닥 종합지수",
              v: liveTicks.nasdaq.toLocaleString(),
              d: getDiffStr(liveTicks.nasdaq, baseTicks.nasdaq),
              up: isUp(liveTicks.nasdaq, baseTicks.nasdaq),
            },
            {
              n: "S&P 500 지수",
              v: liveTicks.sp500.toLocaleString(),
              d: getDiffStr(liveTicks.sp500, baseTicks.sp500),
              up: isUp(liveTicks.sp500, baseTicks.sp500),
            },
            {
              n: "원/달러 환율",
              v: liveTicks.exchangeRate.toLocaleString() + " 원",
              d: getDiffStr(liveTicks.exchangeRate, baseTicks.exchangeRate),
              up: isUp(liveTicks.exchangeRate, baseTicks.exchangeRate),
            },
          ].map((idx, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  {idx.n}
                </p>
                <p className="text-lg font-black text-slate-800">{idx.v}</p>
              </div>
              <span
                className={`text-[11px] font-black px-2 py-1 rounded-lg ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.d}
              </span>
            </div>
          ))}
        </div>

        {/* 대시보드 스펙트럼 */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              순투자원금
            </p>
            <p className="text-xl font-black text-slate-800">
              ₩ {formatNum(stats.netInvestment)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center relative">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              총자산액 (DoD 트래커)
            </p>
            <p className="text-xl font-black text-slate-800">
              ₩ {formatNum(stats.totalAsset)}
            </p>
            <span
              className={`text-[10px] font-black block mt-0.5 ${stats.assetChangeDoD >= 0 ? "text-rose-500" : "text-blue-500"}`}
            >
              {stats.assetChangeDoD >= 0 ? "▲" : "▼"} ₩
              {formatNum(Math.abs(stats.assetChangeDoD))} (
              {stats.assetChangeRateDoD.toFixed(2)}%)
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              총가동 수익률
            </p>
            <p
              className={`text-xl font-black ${stats.totalProfitRate >= 0 ? "text-rose-500" : "text-blue-600"}`}
            >
              {stats.totalProfitRate.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              평가금액 합계
            </p>
            <p className="text-xl font-black text-slate-800">
              ₩ {formatNum(stats.totalEvaluation)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              누적 확정실현손익
            </p>
            <p
              className={`text-xl font-black ${stats.totalRealizedProfit >= 0 ? "text-rose-500" : "text-blue-600"}`}
            >
              ₩ {formatNum(stats.totalRealizedProfit)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 mb-1">
              실시간 예수금 잔고
            </p>
            <p className="text-xl font-black text-slate-700">
              ₩ {formatNum(stats.cashBalance)}
            </p>
          </div>
        </div>

        {/* 메인 컴포넌트 컨테이너 하우징 */}
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
            {/* 탭 1. 보유현황 */}
            {activeTab === "보유현황" && (
              <div>
                <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-[12px] font-black text-slate-600 mb-3 uppercase">
                    📂 포트폴리오 섹터 분산 비중 (컬러 바)
                  </h3>
                  <div className="w-full flex h-6 rounded-xl overflow-hidden border border-slate-300">
                    {stats.sectorWeights.map((sw, idx) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-emerald-500",
                        "bg-amber-500",
                        "bg-indigo-500",
                        "bg-purple-500",
                      ];
                      return (
                        <div
                          key={idx}
                          style={{ width: `${sw.percentage}%` }}
                          className={`${colors[idx % colors.length]} h-full relative group transition-all hover:opacity-90`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white truncate px-1">
                            {sw.percentage > 7
                              ? `${sw.name}(${sw.percentage}%)`
                              : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 flex-wrap">
                    {stats.sectorWeights.map((sw, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600"
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-sm ${["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-purple-500"][idx % 5]}`}
                        ></span>
                        <span>
                          {sw.name}: <b>{sw.percentage}%</b> (₩
                          {formatNum(sw.amount)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr>
                      <th>종목명</th>
                      <th>티커</th>
                      <th>시장구분</th>
                      <th>보유량</th>
                      <th>평균단가</th>
                      <th>현재 장중가격</th>
                      <th>평가금액</th>
                      <th>손익(원화)</th>
                      <th>수익률</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {stats.holdingList.map((h, i) => {
                      const isForeign =
                        h.시장 === "NASDAQ" ||
                        h.시장 === "NYSE" ||
                        (h.티커 &&
                          (h.티커.includes(":") || h.티커.startsWith("AUTO")));
                      return (
                        <tr key={i} className="h-12 border-b hover:bg-slate-50">
                          <td className="font-black text-blue-600">
                            {h.종목명}
                          </td>
                          <td className="italic text-slate-400">{h.티커}</td>
                          <td>
                            <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {h.시장}
                            </span>
                          </td>
                          <td>{formatNum(h.보유량)}</td>
                          <td className="font-mono text-amber-700">
                            {isForeign
                              ? `$ ${formatFloat(h.평균단가)}`
                              : `₩ ${formatNum(h.평균단가)}`}
                          </td>
                          <td className="font-mono text-blue-600">
                            {isForeign
                              ? `$ ${formatFloat(h.현재가)}`
                              : `₩ ${formatNum(h.현재가)}`}
                          </td>
                          <td className="font-black text-slate-800">
                            ₩ {formatNum(h.평가금액)}
                          </td>
                          <td
                            className={
                              h.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                            }
                          >
                            {h.손익 >= 0 ? "+" : ""}
                            {formatNum(h.손익)}
                          </td>
                          <td
                            className={
                              h.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                            }
                          >
                            {h.수익률}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 탭 2. 일별수익률 */}
            {activeTab === "일별수익률" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>날짜</th>
                    <th>총 평가자산 (₩)</th>
                    <th>누적 투자원금 (₩)</th>
                    <th>일일 누적평가손익 (₩)</th>
                    <th>총 가동 수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  {[...stats.dailyList]
                    .sort((a, b) => b.날짜.localeCompare(a.날짜))
                    .map((d, i) => (
                      <tr key={i} className="h-11 border-b hover:bg-slate-50">
                        <td className="font-black text-slate-700">{d.날짜}</td>
                        <td className="font-black">
                          ₩ {formatNum(d.평가금액)}
                        </td>
                        <td className="text-slate-500">
                          ₩ {formatNum(d.누적원금)}
                        </td>
                        <td
                          className={
                            d.일손익 >= 0 ? "text-rose-500" : "text-blue-500"
                          }
                        >
                          {d.일손익 >= 0 ? "+" : ""}
                          {formatNum(d.일손익)}
                        </td>
                        <td
                          className={`font-black ${d.일손익 >= 0 ? "text-rose-500" : "text-blue-500"}`}
                        >
                          {d.일수익률}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 탭 3. 보유종목일별 */}
            {activeTab === "보유종목일별" && (
              <div>
                <div className="mb-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="text-[13px] font-black text-slate-700">
                    보유종목일별 가로전개 매트릭스 피벗
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] font-black text-slate-500">
                      시작일
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
                    />
                    <span className="text-[11px] font-black text-slate-500">
                      종료일
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
                    />
                  </div>
                </div>
                <div className="w-full overflow-x-auto border rounded-2xl border-slate-200">
                  <table className="w-full text-center border-collapse whitespace-nowrap">
                    <thead className="bg-[#f8fafc] text-slate-700 text-[11px] font-black border-b border-slate-200">
                      <tr>
                        <th className="bg-slate-100 text-slate-800 font-black sticky left-0 z-10 px-4">
                          종목명
                        </th>
                        <th>현재보유량</th>
                        <th>평단가(원천)</th>
                        <th className="text-blue-600 bg-blue-50/30">
                          실시간주가
                        </th>
                        {pivotData.filteredDates.map((date) => (
                          <th
                            key={date}
                            className="px-6 font-bold bg-slate-50 border-l border-slate-200"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[12px] font-bold text-slate-800">
                      <tr className="bg-slate-50 font-black text-slate-900 border-b border-slate-300 h-12">
                        <td className="sticky left-0 bg-slate-100 font-black z-10 text-slate-700">
                          일별 수익 합계(원화)
                        </td>
                        <td>-</td>
                        <td>-</td>
                        <td className="bg-blue-50/20">-</td>
                        {pivotData.filteredDates.map((date) => {
                          const tot = pivotData.dailyColumnTotals[date];
                          const isUp = tot ? tot.profit >= 0 : true;
                          return (
                            <td
                              key={date}
                              className={`border-l border-slate-200 font-black ${isUp ? "text-rose-500" : "text-blue-600"}`}
                            >
                              {tot && tot.profit !== 0
                                ? `${tot.profit >= 0 ? "+" : ""}${formatNum(tot.profit)} (${tot.rate.toFixed(2)}%)`
                                : "0 (0%)"}
                            </td>
                          );
                        })}
                      </tr>
                      {pivotData.finalRows.map((row, idx) => {
                        const currentH = stats.holdingList.find(
                          (h) => h.종목명 === row.종목명,
                        );
                        const isForeign =
                          row.시장 === "NASDAQ" ||
                          row.시장 === "NYSE" ||
                          (row.티커 &&
                            (row.티커.includes(":") ||
                              row.티커.startsWith("AUTO")));
                        const curQty = currentH ? currentH.보유량 : 0;
                        const curAvg = currentH ? currentH.평균단가 : 0;
                        const curPrice = liveStockPrices[row.티커] || curAvg;
                        return (
                          <tr
                            key={idx}
                            className="h-12 border-b border-slate-200 hover:bg-slate-50/50"
                          >
                            <td className="sticky left-0 bg-white font-black text-left px-4 border-r border-slate-200 z-10">
                              <span className="block text-slate-900 font-black">
                                {row.종목명}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-medium italic">
                                {row.시장}:{row.티커}
                              </span>
                            </td>
                            <td>{curQty > 0 ? formatNum(curQty) : "0"}</td>
                            <td className="font-mono text-amber-700">
                              {curQty > 0
                                ? isForeign
                                  ? `$${formatFloat(curAvg)}`
                                  : `₩${formatNum(curAvg)}`
                                : "-"}
                            </td>
                            <td className="bg-blue-50/10 font-mono font-black text-blue-600">
                              {isForeign
                                ? `$${formatFloat(curPrice)}`
                                : `₩${formatNum(curPrice)}`}
                            </td>
                            {pivotData.filteredDates.map((date) => {
                              const snap = row.역사적내역[date];
                              if (!snap)
                                return (
                                  <td
                                    key={date}
                                    className="border-l border-slate-200 text-slate-300 font-normal italic"
                                  >
                                    -
                                  </td>
                                );
                              return (
                                <td
                                  key={date}
                                  className={`border-l border-slate-200 font-medium ${snap.profit >= 0 ? "text-rose-500" : "text-blue-500"}`}
                                >
                                  <span className="block font-bold">
                                    ₩{formatNum(snap.profit)}
                                  </span>
                                  <span className="block text-[10px]">
                                    ({snap.rate.toFixed(1)}%)
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 탭 4. 월별수익률 */}
            {activeTab === "월별수익률" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>해당월</th>
                    <th>기말 자산총액</th>
                    <th>순 투자원금</th>
                    <th>월간 손익총량</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  {stats.monthlyList.map((m, i) => (
                    <tr key={i} className="h-11 border-b hover:bg-slate-50">
                      <td className="font-black text-blue-600">{m.해당월}</td>
                      <td className="font-black">₩ {formatNum(m.기말자산)}</td>
                      <td>₩ {formatNum(m.순입출금)}</td>
                      <td
                        className={
                          m.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {m.월간손익 >= 0 ? "+" : ""}
                        {formatNum(m.월간손익)}
                      </td>
                      <td
                        className={
                          m.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {m.수익률}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 탭 5. 입출금 */}
            {activeTab === "입출금" && (
              <div>
                <div className="mb-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-[12px]">
                  <div>
                    <span className="font-black text-blue-800">
                      💡 입출금 CSV 데이터 가이드라인 :
                    </span>
                    <span className="text-slate-600 ml-2">
                      헤더 포맷 <code>[날짜,구분,금액,메모]</code> / 예시:{" "}
                      <code>2026-05-18,입금,5000000,초기자금</code>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadCashCsv}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-black hover:bg-blue-100/50 transition-all"
                    >
                      📥 입출금 양식/내역 다운로드
                    </button>
                    <button
                      onClick={() => tabCashCsvRef.current.click()}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-blue-700 transition-all"
                    >
                      📤 입출금 CSV 업로드
                    </button>
                    <input
                      type="file"
                      ref={tabCashCsvRef}
                      onChange={handleUploadCashCsv}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="mb-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-5 gap-4 items-end">
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
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      구분
                    </label>
                    <select
                      value={newCash.구분}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 구분: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>입금</option>
                      <option>출금</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      현금 금액(KRW)
                    </label>
                    <input
                      type="text"
                      value={newCash.금액}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 금액: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="숫자만 입력"
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
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="자유 기재"
                    />
                  </div>
                  <button
                    onClick={saveCash}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md hover:bg-slate-800 transition-all"
                  >
                    입출금 내역 저장
                  </button>
                </div>
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
                  >
                    선택 일괄 삭제
                  </button>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            cashFlows.length > 0 &&
                            cashFlows.every((c) => selectedIds.includes(c.id))
                          }
                          onChange={handleSelectAllToggle}
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
                      <tr
                        key={c.id}
                        className="h-11 border-b hover:bg-slate-50"
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td>{c.날짜}</td>
                        <td
                          className={
                            c.구분 === "입금"
                              ? "text-rose-500"
                              : "text-blue-500"
                          }
                        >
                          {c.구분}
                        </td>
                        <td className="font-black">₩{formatNum(c.금액)}</td>
                        <td className="text-slate-600 text-left px-4">
                          {c.메모 || "-"}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteItem(c.id)}
                            className="text-rose-500 underline text-[12px]"
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

            {/* 탭 6. 거래관리 (수수료, 세금 보존 및 안전 마스킹 조치) */}
            {activeTab === "거래관리" && (
              <div>
                <div className="mb-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-[12px]">
                  <div>
                    <span className="font-black text-emerald-800">
                      💡 매매거래 CSV 데이터 가이드라인 :
                    </span>
                    <span className="text-slate-600 ml-2">
                      포맷{" "}
                      <code>[구분,날짜,종목명,티커,수량,단가,수수료,세금]</code>{" "}
                      / 티커가 누락되어도 파싱 깨짐이 발생하지 않도록
                      조치됨{" "}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadTxCsv}
                      className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-100/50 transition-all"
                    >
                      📥 거래관리 양식/내역 다운로드
                    </button>
                    <button
                      onClick={() => tabTxCsvRef.current.click()}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-emerald-700 transition-all"
                    >
                      📤 거래내역 CSV 업로드
                    </button>
                    <input
                      type="file"
                      ref={tabTxCsvRef}
                      onChange={handleUploadTxCsv}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                </div>

                <div
                  className={`mb-8 p-6 rounded-2xl border transition-all ${editingId ? "bg-amber-50/50 border-amber-300 shadow-md" : "bg-slate-50 border-slate-200"} grid grid-cols-4 gap-4 items-end`}
                >
                  <div className="col-span-4 font-black text-[14px] text-slate-700 flex justify-between">
                    <span>
                      {editingId
                        ? "⚠️ [편집 모드] 선택 매매 건 상세 수동 수정 오버라이드"
                        : "✍️ 매매 거래 내역 수동 신규 기입 양식"}
                    </span>
                    {editingId && (
                      <button
                        onClick={resetForms}
                        className="text-slate-400 underline text-[11px] font-normal"
                      >
                        편집 모드 나가기
                      </button>
                    )}
                  </div>
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
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
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
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      종목 매핑선택
                    </label>
                    <select
                      value={newTx.종목명}
                      onChange={(e) => {
                        const found = stockMaster.find(
                          (sm) => sm.종목명 === e.target.value,
                        );
                        setNewTx({
                          ...newTx,
                          종목명: e.target.value,
                          티커: found ? found.티커 : "",
                        });
                      }}
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold bg-white"
                    >
                      <option value="">--선택--</option>
                      {stockMaster.map((s) => (
                        <option key={s.id} value={s.종목명}>
                          {s.종목명} ({s.티커})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      거래 수량
                    </label>
                    <input
                      type="text"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, su량: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      거래 단가 (해외주식=달러단가)
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
                    <label className="text-[11px] font-black text-slate-500">
                      제수수료 (KRW)
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
                    <label className="text-[11px] font-black text-slate-500">
                      거래세 등 제세금 (KRW)
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
                    className={`w-full py-3.5 rounded-xl text-[12px] font-black shadow-md text-white ${editingId ? "bg-amber-600 animate-pulse" : "bg-slate-900"}`}
                  >
                    {editingId
                      ? "수정사항 확정 및 레코드 반영"
                      : "거래 레코드 추가"}
                  </button>
                </div>
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
                  >
                    선택 일괄 삭제
                  </button>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            transactions.length > 0 &&
                            transactions.every((t) =>
                              selectedIds.includes(t.id),
                            )
                          }
                          onChange={handleSelectAllToggle}
                        />
                      </th>
                      <th>날짜</th>
                      <th>구분</th>
                      <th>종목명</th>
                      <th>티커</th>
                      <th>수량</th>
                      <th>거래단가</th>
                      <th>수수료</th>
                      <th>세금</th>
                      <th>원화 계산총액</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {transactions.map((t) => {
                      const isForeign =
                        t.시장 === "NASDAQ" ||
                        t.시장 === "NYSE" ||
                        (t.티커 &&
                          (t.티커.includes(":") || t.티커.startsWith("AUTO")));
                      return (
                        <tr
                          key={t.id}
                          className={`h-11 border-b hover:bg-slate-50 ${editingId === t.id ? "bg-amber-50" : ""}`}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={() => toggleSelect(t.id)}
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
                          <td className="font-black text-slate-800">
                            {t.종목명}
                          </td>
                          <td className="text-slate-400 italic">{t.티커}</td>
                          <td>{formatNum(t.수량)}</td>
                          <td className="font-mono text-amber-700">
                            {isForeign
                              ? `$ ${formatFloat(t.단가)}`
                              : `₩ ${formatNum(t.단가)}`}
                          </td>
                          <td className="text-slate-500">
                            ₩{formatNum(t.수수료)}
                          </td>
                          <td className="text-slate-500">
                            ₩{formatNum(t.세금)}
                          </td>
                          <td className="font-black text-slate-700">
                            ₩ {formatNum(t.합계)}
                          </td>
                          <td className="space-x-2">
                            <button
                              onClick={() => triggerEditTx(t)}
                              className="text-amber-600 underline font-black"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => deleteItem(t.id)}
                              className="text-rose-500 underline"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 탭 7. 종목마스터 */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-[12px]">
                  <div>
                    <span className="font-black text-purple-800">
                      💡 종목 마스터 CSV 가이드라인 :
                    </span>
                    <span className="text-slate-600 ml-2">
                      포맷 <code>[티커코드,종목명,시장분류,섹터분류]</code> /
                      티커 미기입 시 시스템 자동 고유 해시코드 등록
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadMasterCsv}
                      className="bg-white text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg font-black hover:bg-purple-100/50 transition-all"
                    >
                      📥 종목마스터 양식/내역 다운로드
                    </button>
                    <button
                      onClick={() => tabMasterCsvRef.current.click()}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-purple-700 transition-all"
                    >
                      📤 종목마스터 CSV 업로드
                    </button>
                    <input
                      type="file"
                      ref={tabMasterCsvRef}
                      onChange={handleUploadMasterCsv}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-5 gap-4 items-end">
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
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="예: 삼성전자"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      티커코드 (공란 시 자동 생성)
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 티커: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="예: 005930"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      시장분류
                    </label>
                    <select
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>NASDAQ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      섹터군분류
                    </label>
                    <select
                      value={newStock.섹터}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 섹터: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>일반제조/서비스</option>
                      <option>바이오/헬스케어</option>
                      <option>전기차/자동차</option>
                      <option>2차전지/친환경에너지</option>
                      <option>금융/지주사</option>
                    </select>
                  </div>
                  <button
                    onClick={saveMaster}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md hover:bg-slate-800 transition-all"
                  >
                    마스터 사전등록
                  </button>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th>티커코드</th>
                      <th>종목명</th>
                      <th>시장분류</th>
                      <th>섹터분류</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {stockMaster.map((s) => (
                      <tr
                        key={s.id}
                        className="h-12 border-b hover:bg-slate-50"
                      >
                        <td className="text-blue-600 font-black italic">
                          {s.티커}
                        </td>
                        <td className="font-black text-slate-800">
                          {s.종목명}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 text-[11px] font-black rounded-md bg-purple-50 text-purple-600">
                            {s.시장}
                          </span>
                        </td>
                        <td className="text-emerald-600 text-[12px]">
                          {s.섹터 || "일반제조/서비스"}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteItem(s.id)}
                            className="text-rose-500 underline text-[12px]"
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

            {/* 탭 8. 일별종가 */}
            {activeTab === "일별종가" && (
              <div>
                <div className="mb-6 p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex items-end gap-4">
                  <div className="text-[13px] font-black text-amber-800">
                    🛠️ 주가 오버라이드 실시간 고정 수동 제어
                  </div>
                  <div className="space-y-1 ml-auto">
                    <label className="block text-[10px] text-slate-400 font-bold">
                      대상 종목 지정
                    </label>
                    <select
                      value={manualPriceForm.티커}
                      onChange={(e) =>
                        setManualPriceForm({
                          ...manualPriceForm,
                          티커: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold bg-white"
                    >
                      <option value="">--종목 선택--</option>
                      {stockMaster.map((s) => (
                        <option key={s.id} value={s.티커}>
                          {s.종목명} ({s.티커})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold">
                      수동 지정가(해외=달러)
                    </label>
                    <input
                      type="number"
                      placeholder="가격 입력"
                      value={manualPriceForm.가격}
                      onChange={(e) =>
                        setManualPriceForm({
                          ...manualPriceForm,
                          가격: e.target.value,
                        })
                      }
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={handleApplyManualPrice}
                    className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-amber-700 transition-all"
                  >
                    시세 오버라이드 적용
                  </button>
                </div>

                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                    <tr>
                      <th>기준일자</th>
                      <th>티커</th>
                      <th>종목명</th>
                      <th>시장구분</th>
                      <th>현재 보유수량</th>
                      <th>장중 현재가 (Live)</th>
                      <th>기준대비 변동추이</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {stockMaster.map((s, i) => {
                      const isForeign =
                        s.시장 === "NASDAQ" ||
                        s.시장 === "NYSE" ||
                        (s.티커 &&
                          (s.티커.includes(":") || s.티커.startsWith("AUTO")));
                      const currentPrice =
                        liveStockPrices[s.티커] !== undefined
                          ? liveStockPrices[s.티커]
                          : isForeign
                            ? 10.0
                            : 10000;
                      const originPrice =
                        defaultStockPrices[s.티커] ||
                        (isForeign ? 10.0 : 10000);
                      const diff = currentPrice - originPrice;
                      const pct = ((diff / originPrice) * 100).toFixed(2);
                      const hQty = activeHoldingQuantities[s.종목명] || 0;

                      return (
                        <tr
                          key={i}
                          className={`h-11 border-b hover:bg-slate-50 ${hQty > 0 ? "bg-blue-50/40" : ""}`}
                        >
                          <td>{today}</td>
                          <td className="text-blue-600 font-black">{s.티커}</td>
                          <td className="font-black text-slate-800">
                            {s.종목명}
                          </td>
                          <td>
                            <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">
                              {s.시장}
                            </span>
                          </td>
                          <td
                            className={
                              hQty > 0
                                ? "font-black text-blue-600"
                                : "text-slate-400 font-normal"
                            }
                          >
                            {formatNum(hQty)}
                          </td>
                          <td className="font-mono font-black text-slate-900">
                            {isForeign
                              ? `$ ${formatFloat(currentPrice)}`
                              : `₩ ${formatNum(currentPrice)}`}
                          </td>
                          <td>
                            <span
                              className={`text-[11px] font-black ${diff >= 0 ? "text-rose-500" : "text-blue-500"}`}
                            >
                              {diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
      `}</style>
    </div>
  );
}
