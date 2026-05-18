export const parseCleanNum = (value) => {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
};

export const createEditableTransaction = (item) => ({
  날짜: item.날짜,
  구분: item.구분,
  종목명: item.종목명,
  티커: item.티커,
  수량: String(item.수량),
  단가: String(item.단가),
  수수료: String(item.수수료),
  세금: String(item.세금),
});

export const createEditableStock = (item) => ({
  티커: item.티커,
  종목명: item.종목명,
  시장: item.시장,
  섹터: item.섹터 || "일반제조/서비스",
});

export const applyManualPrice = (liveStockPrices, manualPriceForm) => ({
  ...liveStockPrices,
  [manualPriceForm.티커]: Number(manualPriceForm.가격),
});

export const buildTransactionPayload = ({
  newTx,
  editingId,
  stockMaster,
}) => {
  const quantity = parseCleanNum(newTx.수량);
  const price = parseCleanNum(newTx.단가);
  const fee = parseCleanNum(newTx.수수료);
  const tax = parseCleanNum(newTx.세금);

  const masterMatch = stockMaster.find((stock) => stock.종목명 === newTx.종목명);
  const currentTicker = masterMatch
    ? masterMatch.티커
    : newTx.티커
      ? newTx.티커.trim()
      : "999999";

  return {
    ...newTx,
    id: editingId || Date.now(),
    티커: currentTicker,
    수량: quantity,
    단가: price,
    수수료: fee,
    세금: tax,
  };
};

export const upsertTransaction = (transactions, editingId, payload) =>
  editingId
    ? transactions.map((item) => (item.id === editingId ? payload : item))
    : [payload, ...transactions];

export const buildCashPayload = (newCash) => {
  const amount = parseCleanNum(newCash.금액);
  if (amount <= 0) return null;
  return { ...newCash, id: Date.now(), 금액: amount };
};

export const buildStockSaveResult = ({
  stockMaster,
  transactions,
  newStock,
  masterEditingId,
}) => {
  let targetTicker = newStock.티커 ? newStock.티커.trim() : "";
  if (targetTicker === "") {
    targetTicker = `AUTO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  if (masterEditingId) {
    const nextStockMaster = stockMaster.map((item) =>
      item.id === masterEditingId
        ? { ...newStock, 티커: targetTicker, id: masterEditingId }
        : item,
    );

    const oldMaster = stockMaster.find((item) => item.id === masterEditingId);
    const nextTransactions =
      oldMaster && oldMaster.종목명 !== newStock.종목명
        ? transactions.map((tx) =>
            tx.종목명 === oldMaster.종목명
              ? { ...tx, 종목명: newStock.종목명, 티커: targetTicker }
              : tx,
          )
        : transactions.map((tx) =>
            tx.종목명 === newStock.종목명 ? { ...tx, 티커: targetTicker } : tx,
          );

    return { stockMaster: nextStockMaster, transactions: nextTransactions };
  }

  return {
    stockMaster: [
      ...stockMaster,
      { ...newStock, 티커: targetTicker, id: Date.now() },
    ],
    transactions,
  };
};

export const removeItemByTab = ({
  activeTab,
  id,
  transactions,
  cashFlows,
  stockMaster,
}) => ({
  transactions:
    activeTab === "거래관리"
      ? transactions.filter((item) => item.id !== id)
      : transactions,
  cashFlows:
    activeTab === "입출금"
      ? cashFlows.filter((item) => item.id !== id)
      : cashFlows,
  stockMaster:
    activeTab === "종목마스터"
      ? stockMaster.filter((item) => item.id !== id)
      : stockMaster,
});

export const toggleSelectedId = (selectedIds, id) =>
  selectedIds.includes(id)
    ? selectedIds.filter((item) => item !== id)
    : [...selectedIds, id];

export const getSelectableTargets = ({
  activeTab,
  transactions,
  cashFlows,
  stockMaster,
}) => {
  if (activeTab === "거래관리") return transactions.map((item) => item.id);
  if (activeTab === "입출금") return cashFlows.map((item) => item.id);
  if (activeTab === "종목마스터") return stockMaster.map((item) => item.id);
  return [];
};

export const toggleAllSelectedIds = (selectedIds, targets) => {
  if (targets.every((id) => selectedIds.includes(id))) {
    return selectedIds.filter((id) => !targets.includes(id));
  }
  return Array.from(new Set([...selectedIds, ...targets]));
};

export const removeSelectedByTab = ({
  activeTab,
  selectedIds,
  transactions,
  cashFlows,
  stockMaster,
}) => ({
  transactions:
    activeTab === "거래관리"
      ? transactions.filter((item) => !selectedIds.includes(item.id))
      : transactions,
  cashFlows:
    activeTab === "입출금"
      ? cashFlows.filter((item) => !selectedIds.includes(item.id))
      : cashFlows,
  stockMaster:
    activeTab === "종목마스터"
      ? stockMaster.filter((item) => !selectedIds.includes(item.id))
      : stockMaster,
});
