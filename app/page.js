"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AppHeader from "@/components/app-header";
import AssetSummaryGrid from "@/components/asset-summary-grid";
import CashFlowsTab from "@/components/cash-flows-tab";
import DailyPricesTab from "@/components/daily-prices-tab";
import DailyReturnsTab from "@/components/daily-returns-tab";
import HoldingsTab from "@/components/holdings-tab";
import MarketIndexGrid from "@/components/market-index-grid";
import MonthlyReturnsTab from "@/components/monthly-returns-tab";
import PivotHistoryTab from "@/components/pivot-history-tab";
import StockMasterTab from "@/components/stock-master-tab";
import TabNavigation from "@/components/tab-navigation";
import TransactionsTab from "@/components/transactions-tab";
import {
  applyManualPrice,
  buildCashPayload,
  buildStockSaveResult,
  buildTransactionPayload,
  createEditableStock,
  createEditableTransaction,
  getSelectableTargets,
  parseCleanNum,
  removeItemByTab,
  removeSelectedByTab,
  toggleAllSelectedIds,
  toggleSelectedId,
  upsertTransaction,
} from "@/lib/crud-utils";
import {
  buildCashCsvRows,
  buildMasterCsvRows,
  buildTemplateCsvRows,
  buildTransactionsCsvRows,
  downloadCsv,
  parseCashFlowsCsv,
  parseIntegratedTransactionsCsv,
  parseStockMasterCsv,
  parseTransactionsCsv,
  readTextFile,
} from "@/lib/csv-utils";
import { buildPortfolioStats } from "@/lib/portfolio-stats";
import { inferMarketFromTicker, isForeignMarket } from "@/lib/market-utils";
import { buildActiveHoldingQuantities, buildPivotData } from "@/lib/pivot-data";
import {
  createInitialCash,
  createInitialManualPriceForm,
  createInitialStock,
  createInitialTx,
  DEFAULT_STOCK_PRICES as defaultStockPrices,
  INITIAL_LIVE_TICKS,
  INITIAL_STOCK_MASTER,
  STORAGE_KEYS,
  TODAY,
} from "@/lib/seed-data";

/**
 * [STOCK-MANAGER ULTIMATE FINAL V39.11 - PIVOT FILTER PATCH]
 * - [개선] '보유종목일별' 탭의 시작일/종료일 지정 후 [조회] 버튼 클릭 시 필터링 완벽 바인딩
 * - [보존] 외국주식 시장분류 수정 시 거래단가, 수수료, 세금 통화 자동 변경 스위칭 유지
 * - [준수] 5대 기본 전제 완벽 준수 및 단 한 줄의 생략도 없는 무삭제 완전체 코드
 */

export default function StockManagerUltimateV39_11() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [cashEditingId, setCashEditingId] = useState(null);
  const [masterEditingId, setMasterEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const csvUploadRef = useRef(null);
  const tabCashCsvRef = useRef(null);
  const tabTxCsvRef = useRef(null);
  const tabMasterCsvRef = useRef(null);

  // --- [조회 기간 필터 및 실동작 트리거 상태] ---
  const [startDate, setStartDate] = useState("2026-05-06");
  const [endDate, setEndDate] = useState("2026-05-15");
  const [appliedFilter, setAppliedFilter] = useState({
    start: "2026-05-06",
    end: "2026-05-15",
  });

  // --- [기준 가격 및 실시간 틱 데이터] ---
  const [liveTicks, setLiveTicks] = useState(INITIAL_LIVE_TICKS);
  const [indexChangePercents, setIndexChangePercents] = useState({
    kospi: 0,
    kosdaq: 0,
    dow: 0,
    nasdaq: 0,
    sp500: 0,
    exchangeRate: 0,
  });

  const [liveStockPrices, setLiveStockPrices] = useState(defaultStockPrices);
  const [dailyPriceSnapshots, setDailyPriceSnapshots] = useState({});
  const [livePriceStatus, setLivePriceStatus] = useState({});

  // --- [핵심 데이터 엔티티 상태 배열] ---
  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [stockMaster, setStockMaster] = useState(INITIAL_STOCK_MASTER);

  const [isLoaded, setIsLoaded] = useState(false);
  const today = TODAY;

  // --- [개별 입력 폼 상태 구조 정의] ---
  const [newTx, setNewTx] = useState(() => createInitialTx(today));
  const [newCash, setNewCash] = useState(() => createInitialCash(today));
  const [newStock, setNewStock] = useState(createInitialStock);
  const [manualPriceForm, setManualPriceForm] = useState(
    createInitialManualPriceForm,
  );
  const [cashTotalInput, setCashTotalInput] = useState("");

  const refreshDailyPrices = useCallback(async () => {
    const response = await fetch("/api/daily-prices", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("일별 종가 데이터를 불러오지 못했습니다.");
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return;
    }

    const snapshotMap = rows.reduce((acc, row) => {
      acc[row.code] = row;
      return acc;
    }, {});

    setDailyPriceSnapshots(snapshotMap);
  }, []);

  // 종목 현재가 기본값만 유지하고, 난수 시뮬레이션은 제거
  useEffect(() => {
    setLiveStockPrices((prev) => {
      const updated = { ...prev };
      stockMaster.forEach((sm) => {
        if (updated[sm.티커] === undefined) {
          const isForeign = isForeignMarket(sm.시장, sm.티커);
          updated[sm.티커] = isForeign ? 10.0 : 10000;
        }
      });
      return updated;
    });
  }, [stockMaster]);

  // 지수 카드는 실제 API 응답을 주기적으로 반영
  useEffect(() => {
    let cancelled = false;

    const fetchIndices = async () => {
      try {
        const response = await fetch("/api/indices", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const items = await response.json();
        if (cancelled || !Array.isArray(items)) {
          return;
        }

        setLiveTicks((prev) => {
          const next = { ...prev };

          items.forEach((item) => {
            if (item?.key && typeof item.value === "number") {
              next[item.key] = item.value;
            }
          });

          return next;
        });

        setIndexChangePercents((prev) => {
          const next = { ...prev };

          items.forEach((item) => {
            if (item?.key && typeof item.changePercent === "number") {
              next[item.key] = item.changePercent;
            }
          });

          return next;
        });
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (_error) {
        // Keep the previous values on transient fetch failures.
      }
    };

    fetchIndices();
    const timer = setInterval(fetchIndices, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDailyPrices = async () => {
      try {
        await refreshDailyPrices();
        if (cancelled) {
          return;
        }
      } catch (_error) {
        // Ignore transient fetch errors and keep the last snapshot.
      }
    };

    fetchDailyPrices();
    const timer = setInterval(fetchDailyPrices, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshDailyPrices]);

  const EXCHANGE_RATE = liveTicks.exchangeRate;

  const getChangeStr = (pct) =>
    pct >= 0 ? `▲ ${pct.toFixed(2)}%` : `▼ ${Math.abs(pct).toFixed(2)}%`;

  // [전제 5 보존] 마운트 시점에 로컬 스토리지 복구
  useEffect(() => {
    let cancelled = false;

    const bootstrapState = async () => {
      const savedTx = localStorage.getItem(STORAGE_KEYS.TX);
      const savedCash = localStorage.getItem(STORAGE_KEYS.CASH);
      const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

      try {
        const response = await fetch("/api/app-state", { cache: "no-store" });

        if (response.ok) {
          const remoteState = await response.json();

          if (cancelled) {
            return;
          }

          if (Array.isArray(remoteState.transactions)) {
            setTransactions(remoteState.transactions);
          } else if (savedTx) {
            setTransactions(JSON.parse(savedTx));
          }

          if (Array.isArray(remoteState.cashFlows)) {
            setCashFlows(remoteState.cashFlows);
          } else if (savedCash) {
            setCashFlows(JSON.parse(savedCash));
          }

          if (Array.isArray(remoteState.stockMaster) && remoteState.stockMaster.length > 0) {
            setStockMaster(remoteState.stockMaster);
          } else if (savedMaster) {
            setStockMaster(JSON.parse(savedMaster));
          }

          setIsLoaded(true);
          return;
        }
      } catch (_error) {
        // Fall back to local storage if remote state is unavailable.
      }

      if (cancelled) {
        return;
      }

      if (savedTx) setTransactions(JSON.parse(savedTx));
      if (savedCash) setCashFlows(JSON.parse(savedCash));
      if (savedMaster) setStockMaster(JSON.parse(savedMaster));
      setIsLoaded(true);
    };

    bootstrapState();

    return () => {
      cancelled = true;
    };
  }, []);

  // [전제 5 보존] 상태 변경 시 안전하게 스토리지 업데이트
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashFlows));
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(stockMaster));

    fetch("/api/app-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions,
        cashFlows,
        stockMaster,
      }),
    }).catch(() => {
      // Keep local storage as a fallback even if remote save fails.
    });
  }, [transactions, cashFlows, stockMaster, isLoaded]);

  const formatNum = (n) => (n ? Math.round(Number(n)).toLocaleString() : "0");
  const formatFloat = (n) =>
    n
      ? Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  // 백업 파일 입출력 핸들러 (JSON)
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
          throw new Error("필수 백업 데이터 포맷이 일치하지 않습니다.");
        }
        if (confirm("⚠️ 기존 내역을 전부 파기하고 백업본으로 복구합니까?")) {
          setTransactions(parsed.transactions);
          setCashFlows(parsed.cashFlows);
          setStockMaster(parsed.stockMaster);
          setErrorMessage("");
          alert("성공적으로 복구가 완료되었습니다.");
        }
      } catch (err) {
        setErrorMessage(`백업 복구 실패: ${err.message}`);
        alert(`[오류] ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const { headers, rows } = buildTemplateCsvRows();
    downloadCsv("통합매매내역_일괄등록_양식.csv", headers, rows);
  };

  // [전제 4 구현] 통합 대량 CSV 업로드 및 자동 티커 핸들러
  const handleUploadCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setErrorMessage("");
      const text = await readTextFile(file, "UTF-8");
      const { transactions: list, masterTokens, errorLines } =
        parseIntegratedTransactionsCsv(text, stockMaster);

      if (errorLines.length > 0) {
        setErrorMessage(`[CSV 분석 경고]\n${errorLines.join("\n")}`);
      }

      if (list.length > 0) {
        if (confirm(`총 ${list.length}건의 데이터를 결합 업로드 하시겠습니까?`)) {
          if (masterTokens.length > 0) {
            setStockMaster((prev) => [...prev, ...masterTokens]);
          }
          setTransactions((prev) => [...list, ...prev]);
        }
      } else {
        alert("업로드 가능한 유효 데이터 행이 전무합니다.");
      }
    } catch (err) {
      setErrorMessage(`통합 CSV 에러: ${err.message}`);
      alert(`[에러] ${err.message}`);
    } finally {
      e.target.value = "";
    }
  };

  // 개별 탭 엑셀(CSV) 입출력 핸들러 그룹
  const handleDownloadCashCsv = () => {
    const { headers, rows } = buildCashCsvRows(cashFlows);
    downloadCsv(`입출금내역_${today}.csv`, headers, rows);
  };

  const handleUploadCashCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const list = parseCashFlowsCsv(text);
      if (
        list.length > 0 &&
        confirm(`총 ${list.length}건의 자본 흐름 데이터를 병합합니까?`)
      ) {
        setCashFlows((prev) => [...list, ...prev]);
      }
    } catch (err) {
      alert("입출금 파싱 에러: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadTxCsv = () => {
    const { headers, rows } = buildTransactionsCsvRows(transactions);
    downloadCsv(`매매거래내역_${today}.csv`, headers, rows);
  };

  const handleUploadTxCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const { transactions: list, masterTokens } = parseTransactionsCsv(
        text,
        stockMaster,
      );
      if (
        list.length > 0 &&
        confirm(`총 ${list.length}건의 거래 내역을 파일 추가 반영합니까?`)
      ) {
        if (masterTokens.length > 0) {
          setStockMaster((prev) => [...prev, ...masterTokens]);
        }
        setTransactions((prev) => [...list, ...prev]);
      }
    } catch (err) {
      alert("거래내역 로드 실패: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadMasterCsv = () => {
    const { headers, rows } = buildMasterCsvRows(stockMaster);
    downloadCsv(`종목마스터_${today}.csv`, headers, rows);
  };

  const handleUploadMasterCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const tokens = parseStockMasterCsv(text, stockMaster);
      if (
        tokens.length > 0 &&
        confirm(
          `신규 종목 마스터 데이터 ${tokens.length}개를 일괄 병합합니까?`,
        )
      ) {
        setStockMaster((prev) => [...prev, ...tokens]);
      }
    } catch (err) {
      alert("마스터 파일 파싱 오류: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  // ==========================================================
  // [자산 및 수익률 실시간 연산 파이프라인 프레임워크]
  // ==========================================================
  const stats = useMemo(
    () =>
      buildPortfolioStats({
        transactions,
        cashFlows,
        exchangeRate: EXCHANGE_RATE,
        liveStockPrices,
        stockMaster,
        today,
      }),
    [transactions, cashFlows, EXCHANGE_RATE, liveStockPrices, stockMaster, today],
  );

  // ==========================================
  // [조회 버튼 클릭 시 실시간 작동하도록 버그 전면 해결 피벗 연산 체계]
  // ==========================================
  const pivotData = useMemo(
    () =>
      buildPivotData({
        allDates: stats.allDates,
        holdingList: stats.holdingList,
        transactions,
        stockMaster,
        liveStockPrices,
        exchangeRate: EXCHANGE_RATE,
        appliedFilter,
      }),
    [
      stats.allDates,
      stats.holdingList,
      transactions,
      stockMaster,
      liveStockPrices,
      EXCHANGE_RATE,
      appliedFilter,
    ],
  );

  const activeHoldingQuantities = useMemo(
    () => buildActiveHoldingQuantities(stats.holdingList),
    [stats.holdingList],
  );

  useEffect(() => {
    if (activeTab !== "입출금") {
      return;
    }
    setCashTotalInput(String(Math.round(stats.cashBalance || 0)));
  }, [stats.cashBalance, activeTab]);

  useEffect(() => {
    let cancelled = false;

    const fetchLivePrices = async () => {
      const targetStocks = stockMaster.filter(
        (stock) => (activeHoldingQuantities[stock.종목명] || 0) > 0,
      );

      if (targetStocks.length === 0) {
        return;
      }

      const settled = await Promise.allSettled(
        targetStocks.map(async (stock) => {
          const response = await fetch(
            `/api/price?code=${encodeURIComponent(stock.티커)}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || `Failed to fetch ${stock.티커}`);
          }

          const data = await response.json();
          return {
            ticker: stock.티커,
            price: Number(data.price),
            sourceCode: data.sourceCode || stock.티커,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      setLiveStockPrices((prev) => {
        const next = { ...prev };

        settled.forEach((result) => {
          if (result.status === "fulfilled" && Number.isFinite(result.value.price)) {
            next[result.value.ticker] = result.value.price;
          }
        });

        return next;
      });
      setLivePriceStatus(() => {
        const next = {};

        targetStocks.forEach((stock, index) => {
          const result = settled[index];

          if (
            result?.status === "fulfilled" &&
            Number.isFinite(result.value.price)
          ) {
            next[stock.티커] = {
              ok: true,
              message: `실시간 수신 (${result.value.sourceCode})`,
            };
            return;
          }

          next[stock.티커] = {
            ok: false,
            message:
              result?.status === "rejected"
                ? result.reason?.message || "실시간 수신 실패"
                : "실시간 수신 실패",
          };
        });

        return next;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    };

    fetchLivePrices();
    const timer = setInterval(fetchLivePrices, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stockMaster, activeHoldingQuantities]);

  const marketIndexItems = useMemo(
    () => [
      {
        n: "KOSPI 지수",
        v: liveTicks.kospi.toLocaleString(),
        d: getChangeStr(indexChangePercents.kospi),
        up: indexChangePercents.kospi >= 0,
      },
      {
        n: "KOSDAQ 지수",
        v: liveTicks.kosdaq.toLocaleString(),
        d: getChangeStr(indexChangePercents.kosdaq),
        up: indexChangePercents.kosdaq >= 0,
      },
      {
        n: "다우존스 지수",
        v: liveTicks.dow.toLocaleString(),
        d: getChangeStr(indexChangePercents.dow),
        up: indexChangePercents.dow >= 0,
      },
      {
        n: "나스닥 종합지수",
        v: liveTicks.nasdaq.toLocaleString(),
        d: getChangeStr(indexChangePercents.nasdaq),
        up: indexChangePercents.nasdaq >= 0,
      },
      {
        n: "S&P 500 지수",
        v: liveTicks.sp500.toLocaleString(),
        d: getChangeStr(indexChangePercents.sp500),
        up: indexChangePercents.sp500 >= 0,
      },
      {
        n: "원/달러 환율",
        v: liveTicks.exchangeRate.toLocaleString() + " 원",
        d: getChangeStr(indexChangePercents.exchangeRate),
        up: indexChangePercents.exchangeRate >= 0,
      },
    ],
    [liveTicks, indexChangePercents],
  );

  // [조회] 버튼 핸들러 연결
  const handleExecuteSearch = () => {
    setAppliedFilter({ start: startDate, end: endDate });
  };

  // [CRUD 인터랙션 데이터 제어 그룹]
  const triggerEditTx = (item) => {
    setEditingId(item.id);
    setNewTx(createEditableTransaction(item));
  };

  const triggerEditMaster = (item) => {
    setMasterEditingId(item.id);
    setNewStock(createEditableStock(item));
  };

  const handleApplyManualPrice = () => {
    if (!manualPriceForm.티커 || !manualPriceForm.가격) {
      alert("종목 및 단가를 재확인하세요.");
      return;
    }
    setLiveStockPrices((prev) => applyManualPrice(prev, manualPriceForm));
    setManualPriceForm({ ...manualPriceForm, 가격: "" });
  };

  const handleCollectDailyPriceHistory = async () => {
    try {
      const response = await fetch("/api/price/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, stockMaster }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "종가 이력 수집에 실패했습니다.");
      }

      await refreshDailyPrices();

      const messageText = result.message ? `\n사유: ${result.message}` : "";
      const targetText =
        typeof result.targets === "number" ? `\n수집 대상 종목 수: ${result.targets}` : "";
      const skippedText =
        Array.isArray(result.skipped) && result.skipped.length > 0
          ? `\n제외 종목: ${result.skipped.map((item) => `${item.code}(${item.reason})`).join(", ")}`
          : "";

      alert(
        `종가 이력 수집 완료\n저장 건수: ${result.updated || 0}${targetText}${messageText}${skippedText}`,
      );
    } catch (error) {
      alert(error.message || "종가 이력 수집에 실패했습니다.");
    }
  };

  const saveTx = () => {
    setErrorMessage("");
    if (!newTx.종목명) {
      setErrorMessage("종목 식별 인자가 누락되었습니다.");
      return;
    }
    const payload = buildTransactionPayload({
      newTx,
      editingId,
      stockMaster,
    });
    setTransactions(upsertTransaction(transactions, editingId, payload));
    resetForms();
  };

  const saveCash = () => {
    const payload = buildCashPayload(newCash);
    if (!payload) return;
    const nextPayload = { ...payload, id: cashEditingId || payload.id };
    if (cashEditingId) {
      setCashFlows(
        cashFlows.map((item) => (item.id === cashEditingId ? nextPayload : item)),
      );
    } else {
      setCashFlows([nextPayload, ...cashFlows]);
    }
    resetForms();
  };

  const triggerEditCash = (item) => {
    setCashEditingId(item.id);
    setNewCash({
      날짜: item.날짜,
      구분: item.구분,
      금액: String(item.금액),
      메모: item.메모 || "",
    });
  };

  const applyCashTotalAdjustment = () => {
    const targetAmount = parseCleanNum(cashTotalInput);
    if (targetAmount < 0) {
      alert("현금 총액은 0 이상이어야 합니다.");
      return;
    }

    const currentAmount = Math.round(stats.cashBalance || 0);
    const diff = targetAmount - currentAmount;
    if (diff === 0) {
      alert("현재 현금 총액과 동일합니다.");
      return;
    }

    const payload = {
      id: Date.now(),
      날짜: today,
      구분: diff > 0 ? "입금" : "출금",
      금액: Math.abs(diff),
      메모: "현금총액수정",
    };
    setCashFlows([payload, ...cashFlows]);
    setCashEditingId(null);
    alert(`현금 총액을 ₩${formatNum(targetAmount)} 기준으로 반영했습니다.`);
  };

  const saveMaster = () => {
    if (!newStock.종목명) return;
    const normalizedTicker = String(newStock.티커 || "")
      .trim()
      .toUpperCase();
    const normalizedMarket = inferMarketFromTicker(normalizedTicker);
    const stockPayload = {
      ...newStock,
      티커: normalizedTicker,
      시장: normalizedTicker ? normalizedMarket : newStock.시장,
      섹터:
        newStock.섹터 && newStock.섹터.trim() !== ""
          ? newStock.섹터
          : normalizedTicker
            ? normalizedMarket === "KOSPI" || normalizedMarket === "KOSDAQ"
              ? "일반제조/서비스"
              : "해외주식"
            : "일반제조/서비스",
    };
    const result = buildStockSaveResult({
      stockMaster,
      transactions,
      newStock: stockPayload,
      masterEditingId,
    });
    setStockMaster(result.stockMaster);
    setTransactions(result.transactions);
    resetForms();
  };

  const handleStockNameChange = (name) => {
    const trimmedName = String(name || "").trim();
    const lookupPool = [...stockMaster, ...INITIAL_STOCK_MASTER];
    const matched = lookupPool.find((item) => item.종목명 === trimmedName);

    setNewStock((prev) => ({
      ...prev,
      종목명: name,
      티커: matched?.티커 || prev.티커,
      시장:
        matched?.시장 ||
        (prev.티커 ? inferMarketFromTicker(prev.티커) : prev.시장),
      섹터: matched?.섹터 || prev.섹터,
    }));
  };

  const handleStockTickerBlur = async () => {
    const normalizedTicker = String(newStock.티커 || "")
      .trim()
      .toUpperCase();
    if (!normalizedTicker) {
      return;
    }

    setNewStock((prev) => ({
      ...prev,
      티커: normalizedTicker,
      시장: inferMarketFromTicker(normalizedTicker),
    }));

    if (!/^\d{6}$/.test(normalizedTicker)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/master/search?code=${encodeURIComponent(normalizedTicker)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      if (!payload?.name) {
        return;
      }

      const matchedByName = stockMaster.find((item) => item.종목명 === payload.name);
      setNewStock((prev) => ({
        ...prev,
        종목명: payload.name,
        티커: normalizedTicker,
        시장: inferMarketFromTicker(normalizedTicker),
        섹터: matchedByName?.섹터 || prev.섹터,
      }));
    } catch (_error) {
      // Keep manual input if name auto lookup fails.
    }
  };

  const deleteItem = (id) => {
    if (!confirm("해당 레코드를 완전히 삭제 파기하시겠습니까?")) return;
    const result = removeItemByTab({
      activeTab,
      id,
      transactions,
      cashFlows,
      stockMaster,
    });
    setTransactions(result.transactions);
    setCashFlows(result.cashFlows);
    setStockMaster(result.stockMaster);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => toggleSelectedId(prev, id));
  };

  const handleSelectAllToggle = () => {
    const targets = getSelectableTargets({
      activeTab,
      transactions,
      cashFlows,
      stockMaster,
    });
    setSelectedIds((prev) => toggleAllSelectedIds(prev, targets));
  };

  const deleteSelected = () => {
    if (
      !confirm(`선택한 ${selectedIds.length}개의 내역을 일괄 파기 삭제합니까?`)
    )
      return;
    const result = removeSelectedByTab({
      activeTab,
      selectedIds,
      transactions,
      cashFlows,
      stockMaster,
    });
    setTransactions(result.transactions);
    setCashFlows(result.cashFlows);
    setStockMaster(result.stockMaster);
    setSelectedIds([]);
  };

  const resetForms = () => {
    setEditingId(null);
    setCashEditingId(null);
    setMasterEditingId(null);
    setNewTx(createInitialTx(today));
    setNewCash(createInitialCash(today));
    setNewStock(createInitialStock());
    setManualPriceForm(createInitialManualPriceForm());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        <AppHeader
          handleDownloadTemplate={handleDownloadTemplate}
          csvUploadRef={csvUploadRef}
          handleDownloadBackup={handleDownloadBackup}
          fileInputRef={fileInputRef}
          handleUploadBackup={handleUploadBackup}
          handleUploadCSV={handleUploadCSV}
          lastUpdate={lastUpdate}
        />

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-[12px] font-bold whitespace-pre-line">
            ⚠️ <b>[데이터 정밀 파싱 시스템 분석 메시지]</b> <br />
            {errorMessage}
          </div>
        )}

        {/* 지수 대시보드 컴포넌트 프레임 */}
        <MarketIndexGrid items={marketIndexItems} />

        {/* 자산 요약 대시보드 */}
        <AssetSummaryGrid stats={stats} formatNum={formatNum} />

        {/* 8개 탭 하우징 프레임 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[850px]">
          <TabNavigation
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              resetForms();
              setSelectedIds([]);
            }}
          />

          <div className="p-8">
            {/* 탭 1. 보유현황 */}
            {activeTab === "보유현황" && (
              <HoldingsTab
                stats={stats}
                formatNum={formatNum}
                formatFloat={formatFloat}
              />
            )}

            {/* 탭 2. 일별수익률 */}
            {activeTab === "일별수익률" && (
              <DailyReturnsTab
                dailyList={stats.dailyList}
                formatNum={formatNum}
              />
            )}

            {/* 탭 3. 보유종목일별 */}
            {activeTab === "보유종목일별" && (
              <PivotHistoryTab
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                handleExecuteSearch={handleExecuteSearch}
                pivotData={pivotData}
                stats={stats}
                liveStockPrices={liveStockPrices}
                formatNum={formatNum}
                formatFloat={formatFloat}
              />
            )}

            {/* 탭 4. 월별수익률 */}
            {activeTab === "월별수익률" && (
              <MonthlyReturnsTab
                monthlyList={stats.monthlyList}
                formatNum={formatNum}
              />
            )}

            {/* 탭 5. 입출금 */}
            {activeTab === "입출금" && (
              <CashFlowsTab
                handleDownloadCashCsv={handleDownloadCashCsv}
                tabCashCsvRef={tabCashCsvRef}
                handleUploadCashCsv={handleUploadCashCsv}
                newCash={newCash}
                setNewCash={setNewCash}
                saveCash={saveCash}
                cashEditingId={cashEditingId}
                triggerEditCash={triggerEditCash}
                cashTotalInput={cashTotalInput}
                setCashTotalInput={setCashTotalInput}
                applyCashTotalAdjustment={applyCashTotalAdjustment}
                currentCashTotal={stats.cashBalance}
                deleteSelected={deleteSelected}
                cashFlows={cashFlows}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                deleteItem={deleteItem}
                formatNum={formatNum}
              />
            )}

            {/* 탭 6. 거래관리 */}
            {activeTab === "거래관리" && (
              <TransactionsTab
                handleDownloadTxCsv={handleDownloadTxCsv}
                tabTxCsvRef={tabTxCsvRef}
                handleUploadTxCsv={handleUploadTxCsv}
                editingId={editingId}
                resetForms={resetForms}
                newTx={newTx}
                setNewTx={setNewTx}
                stockMaster={stockMaster}
                saveTx={saveTx}
                deleteSelected={deleteSelected}
                transactions={transactions}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                formatNum={formatNum}
                formatFloat={formatFloat}
                exchangeRate={EXCHANGE_RATE}
                triggerEditTx={triggerEditTx}
                deleteItem={deleteItem}
              />
            )}

            {/* 탭 7. 종목마스터 */}
            {activeTab === "종목마스터" && (
              <StockMasterTab
                handleDownloadMasterCsv={handleDownloadMasterCsv}
                tabMasterCsvRef={tabMasterCsvRef}
                handleUploadMasterCsv={handleUploadMasterCsv}
                masterEditingId={masterEditingId}
                resetForms={resetForms}
                newStock={newStock}
                setNewStock={setNewStock}
                handleStockNameChange={handleStockNameChange}
                handleStockTickerBlur={handleStockTickerBlur}
                saveMaster={saveMaster}
                deleteSelected={deleteSelected}
                stockMaster={stockMaster}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                triggerEditMaster={triggerEditMaster}
                deleteItem={deleteItem}
              />
            )}

            {/* 탭 8. 일별종가 */}
            {activeTab === "일별종가" && (
              <DailyPricesTab
                manualPriceForm={manualPriceForm}
                setManualPriceForm={setManualPriceForm}
                stockMaster={stockMaster}
                handleApplyManualPrice={handleApplyManualPrice}
                handleCollectDailyPriceHistory={handleCollectDailyPriceHistory}
                activeHoldingQuantities={activeHoldingQuantities}
                liveStockPrices={liveStockPrices}
                dailyPriceSnapshots={dailyPriceSnapshots}
                livePriceStatus={livePriceStatus}
                defaultStockPrices={defaultStockPrices}
                today={today}
                formatNum={formatNum}
                formatFloat={formatFloat}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
