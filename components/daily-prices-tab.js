"use client";

import { useEffect, useMemo, useState } from "react";
import { isForeignMarket } from "@/lib/market-utils";

export default function DailyPricesTab({
  manualPriceForm,
  setManualPriceForm,
  stockMaster,
  handleApplyManualPrice,
  handleCollectDailyPriceHistory,
  activeHoldingQuantities,
  liveStockPrices,
  afterHoursPrices,
  afterHoursStatus,
  dailyPriceSnapshots,
  livePriceStatus,
  today,
  formatNum,
  formatFloat,
}) {
  const [searchTicker, setSearchTicker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [detailTicker, setDetailTicker] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const holdingStocks = useMemo(() => {
    return [...stockMaster].filter((stock) => (activeHoldingQuantities[stock.종목명] || 0) > 0);
  }, [activeHoldingQuantities, stockMaster]);

  const sortedStocks = useMemo(() => {
    return [...holdingStocks]
      .filter((stock) => {
        const keyword = searchTicker.trim().toUpperCase();
        if (!keyword) return true;
        return (
          String(stock.티커 || "").toUpperCase().includes(keyword) ||
          String(stock.종목명 || "").toUpperCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const qtyA = activeHoldingQuantities[a.종목명] || 0;
        const qtyB = activeHoldingQuantities[b.종목명] || 0;
        if ((qtyA > 0) !== (qtyB > 0)) return qtyB > 0 ? 1 : -1;
        if (qtyA !== qtyB) return qtyB - qtyA;
        return String(a.종목명).localeCompare(String(b.종목명), "ko");
      });
  }, [activeHoldingQuantities, holdingStocks, searchTicker]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!detailTicker && !searchDate) {
        setHistoryRows([]);
        return;
      }
      setHistoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (detailTicker) params.set("code", detailTicker);
        if (searchDate) params.set("date", searchDate);
        const response = await fetch(`/api/daily-prices?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("종가 이력을 불러오지 못했습니다.");
        const rows = await response.json();
        const holdingTickers = new Set(holdingStocks.map((stock) => stock.티커));
        setHistoryRows(
          Array.isArray(rows)
            ? rows.filter((row) => holdingTickers.has(row.code))
            : [],
        );
      } catch (_error) {
        setHistoryRows([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [detailTicker, holdingStocks, searchDate]);

  const detailTitle = detailTicker
    ? stockMaster.find((stock) => stock.티커 === detailTicker)?.종목명 || detailTicker
    : searchDate
      ? `${searchDate} 종가 검색 결과`
      : "종가 상세 이력";

  return (
    <div>
      <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-amber-200 shadow-sm grid grid-cols-1 gap-3 sm:flex sm:items-end sm:gap-4">
        <button
          onClick={handleCollectDailyPriceHistory}
          className="w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-slate-700 transition-all"
        >
          최초 매수일 이후 종가 수집
        </button>
        <div className="min-w-0 space-y-1 sm:ml-auto">
          <select
            value={manualPriceForm.티커}
            onChange={(e) => setManualPriceForm({ ...manualPriceForm, 티커: e.target.value })}
            className="w-full min-w-0 border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
          >
            <option value="">--종목 선택--</option>
            {holdingStocks.map((stock) => (
              <option key={stock.id} value={stock.티커}>
                {stock.종목명} ({stock.티커})
              </option>
            ))}
          </select>
        </div>
        <input
          type="number"
          placeholder="현재가 입력"
          value={manualPriceForm.가격}
          onChange={(e) => setManualPriceForm({ ...manualPriceForm, 가격: e.target.value })}
          className="w-full min-w-0 sm:w-auto border rounded-xl px-3 py-2 text-[12px] font-bold"
        />
        <button
          onClick={handleApplyManualPrice}
          className="w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-amber-700 transition-all"
        >
          현재가 반영
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500">종목 검색</label>
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value)}
              placeholder="종목명 또는 티커"
              className="w-full border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500">특정일 검색</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
            />
          </div>
          <button
            onClick={() => {
              setSearchTicker("");
              setSearchDate("");
              setDetailTicker("");
              setHistoryRows([]);
            }}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[12px] font-black hover:bg-slate-100 transition-all"
          >
            검색 초기화
          </button>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table min-w-[1320px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
            <tr>
              <th>기준일</th>
              <th>티커</th>
              <th>종목명</th>
              <th>시장구분</th>
              <th>보유수량</th>
              <th>전일 종가</th>
              <th>당일 정규장 종가</th>
              <th>애프터마켓(참고)</th>
              <th>애프터-당일종가</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold">
            {sortedStocks.map((stock) => {
              const isForeign = isForeignMarket(stock.시장, stock.티커);
              const snapshot = dailyPriceSnapshots[stock.티커];
              const latestCloseDate = snapshot?.latestDate || null;
              const isTodaySnapshot = latestCloseDate === today;
              const previousClose =
                isTodaySnapshot
                  ? snapshot?.previousPrice ?? null
                  : snapshot?.latestPrice ?? null;
              const liveRegularPrice =
                liveStockPrices[stock.티커] !== undefined
                  ? Number(liveStockPrices[stock.티커])
                  : null;
              const todayRegularClose =
                isTodaySnapshot
                  ? snapshot?.latestPrice ?? null
                  : Number.isFinite(liveRegularPrice)
                    ? liveRegularPrice
                    : null;
              const afterPrice =
                afterHoursPrices?.[stock.티커] !== undefined
                  ? afterHoursPrices[stock.티커]
                  : liveStockPrices[stock.티커] !== undefined
                    ? liveStockPrices[stock.티커]
                    : null;
              const basisDate =
                todayRegularClose !== null || afterPrice !== null
                  ? today
                  : latestCloseDate || today;
              const holdingQty = activeHoldingQuantities[stock.종목명] || 0;
              const diff =
                afterPrice !== null && todayRegularClose !== null
                  ? Number(afterPrice) - Number(todayRegularClose)
                  : null;
              const pct =
                diff !== null && Number(todayRegularClose) > 0
                  ? (diff / Number(todayRegularClose)) * 100
                  : null;
              const priceStatus = livePriceStatus[stock.티커];
              const afterStatus = afterHoursStatus?.[stock.티커];

              return (
                <tr
                  key={stock.티커}
                  onClick={() => setDetailTicker(stock.티커)}
                  className={`h-11 border-b cursor-pointer hover:bg-slate-50 ${
                    detailTicker === stock.티커 ? "bg-amber-50" : holdingQty > 0 ? "bg-blue-50/50" : ""
                  }`}
                >
                  <td>{basisDate}</td>
                  <td className="text-blue-600 font-black">{stock.티커}</td>
                  <td className="font-black text-slate-800">{stock.종목명}</td>
                  <td>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">
                      {stock.시장}
                    </span>
                  </td>
                  <td className={holdingQty > 0 ? "font-black text-blue-600" : "text-slate-400"}>
                    {formatNum(holdingQty)}
                  </td>
                  <td className="font-mono text-slate-900">
                    {previousClose === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(previousClose)}`
                        : formatNum(previousClose)}
                  </td>
                  <td className="font-mono text-slate-900">
                    {todayRegularClose === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(todayRegularClose)}`
                        : formatNum(todayRegularClose)}
                    {todayRegularClose !== null && (
                      <div className="mt-1 text-[10px] font-bold text-slate-500">
                        {isTodaySnapshot ? "공식 종가" : "장중 현재가"}
                      </div>
                    )}
                  </td>
                  <td className="font-mono font-black text-slate-900">
                    {afterPrice === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(afterPrice)}`
                        : formatNum(afterPrice)}
                    {priceStatus && (
                      <div className={`mt-1 text-[10px] font-bold ${priceStatus.ok ? "text-emerald-600" : "text-amber-600"}`}>
                        {priceStatus.message}
                      </div>
                    )}
                    {afterStatus?.ok && (
                      <div className="mt-1 text-[10px] font-bold text-violet-600">
                        애프터 {afterStatus.source}
                      </div>
                    )}
                  </td>
                  <td>
                    {pct === null ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span className={`text-[11px] font-black ${diff >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                        {diff >= 0 ? "+" : ""}
                        {isForeign ? formatFloat(diff) : formatNum(diff)} ({pct >= 0 ? "+" : ""}
                        {pct.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="text-[14px] font-black text-slate-800">{detailTitle}</h3>
        </div>
        <div className="data-table-wrap">
          <table className="data-table min-w-[680px] text-center">
            <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
              <tr>
                <th>날짜</th>
                <th>티커</th>
                <th>종목명</th>
                <th>시장</th>
                <th>종가</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-bold">
              {historyLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-400">조회 중...</td>
                </tr>
              ) : historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-400">표시할 종가 이력이 없습니다.</td>
                </tr>
              ) : (
                historyRows.map((row, index) => {
                  const matched = stockMaster.find((stock) => stock.티커 === row.code);
                  const market = matched?.시장 || "";
                  const isForeign = isForeignMarket(market, row.code);
                  return (
                    <tr key={`${row.code}-${row.date}-${index}`} className="h-10 border-b hover:bg-slate-50">
                      <td>{row.date}</td>
                      <td className="text-blue-600 font-black">{row.code}</td>
                      <td className="font-black text-slate-800">{matched?.종목명 || "-"}</td>
                      <td className="text-slate-500">{market || "-"}</td>
                      <td className="font-mono text-slate-900">
                        {isForeign ? `$ ${formatFloat(row.price)}` : formatNum(row.price)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
