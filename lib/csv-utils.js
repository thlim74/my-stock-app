import { inferMarketFromTicker } from "@/lib/market-utils";

const CSV_MIME_TYPE = "text/csv;charset=utf-8;";

const splitCsvLines = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

const createAutoTicker = () =>
  `AUTO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

const inferMarket = (ticker) => inferMarketFromTicker(ticker);

export const downloadCsv = (filename, headers, rows) => {
  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: CSV_MIME_TYPE });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const readTextFile = (file, encoding = "UTF-8") =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () =>
      reject(reader.error || new Error("파일을 읽는 중 오류가 발생했습니다."));
    reader.readAsText(file, encoding);
  });

export const buildTemplateCsvRows = () => ({
  headers: [
    "구분(매수/매도)",
    "날짜(YYYY-MM-DD)",
    "종목명",
    "티커코드",
    "수량",
    "단가",
    "수수료",
    "세금",
  ],
  rows: [
    ["매수", "2026-05-18", "삼성전자", "005930", "10", "73000", "50", "0"],
    [
      "매수",
      "2026-05-18",
      "스타파이터스 스페이스",
      "AMEX:FJET",
      "5",
      "5.20",
      "1.5",
      "0.5",
    ],
  ],
});

export const buildCashCsvRows = (cashFlows) => ({
  headers: ["날짜(YYYY-MM-DD)", "구분(입금/출금)", "금액(원화)", "메모"],
  rows:
    cashFlows.length > 0
      ? cashFlows.map((cash) => [
          cash.날짜,
          cash.구분,
          cash.금액,
          cash.메모 || "",
        ])
      : [["2026-05-18", "입금", "5000000", "초기투자원금"]],
});

export const buildTransactionsCsvRows = (transactions) => ({
  headers: ["구분", "날짜", "종목명", "티커", "수량", "단가", "수수료", "세금"],
  rows:
    transactions.length > 0
      ? transactions.map((tx) => [
          tx.구분,
          tx.날짜,
          tx.종목명,
          tx.티커,
          tx.수량,
          tx.단가,
          tx.수수료,
          tx.세금,
        ])
      : [["매수", "2026-05-18", "삼성전자", "005930", "5", "73000", "0", "0"]],
});

export const buildMasterCsvRows = (stockMaster) => ({
  headers: ["티커코드", "종목명", "시장분류", "섹터분류"],
  rows: stockMaster.map((stock) => [
    stock.티커,
    stock.종목명,
    stock.시장,
    stock.섹터 || "일반제조/서비스",
  ]),
});

export const parseIntegratedTransactionsCsv = (text, stockMaster) => {
  const lines = splitCsvLines(text);
  if (lines.length <= 1) {
    throw new Error("파싱할 레코드가 데이터 파일에 존재하지 않습니다.");
  }

  const transactions = [];
  const masterTokens = [];
  const errorLines = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",").map((cell) => cell.trim());
    if (row.length < 4) {
      errorLines.push(`${i + 1}라인: 열 불완전`);
      continue;
    }

    const gubun = row[0];
    const date = row[1];
    const name = row[2];
    let ticker = row[3] || "";
    const qty = Number(row[4]) || 0;
    const price = Number(row[5]) || 0;
    const fee = Number(row[6]) || 0;
    const tax = Number(row[7]) || 0;

    if (!gubun || !date || !name) {
      errorLines.push(`${i + 1}라인: 필수 정보 누락`);
      continue;
    }

    if (!ticker) {
      const existing = stockMaster.find((stock) => stock.종목명 === name);
      ticker = existing ? existing.티커 : createAutoTicker();
    }

    const masterExists =
      stockMaster.some((stock) => stock.티커 === ticker) ||
      masterTokens.some((stock) => stock.티커 === ticker);

    if (!masterExists) {
      masterTokens.push({
        id: Date.now() + i + 800,
        티커: ticker,
        종목명: name,
        시장: inferMarket(ticker),
        섹터: "일반제조/서비스",
      });
    }

    transactions.push({
      id: Date.now() + i,
      날짜: date,
      구분: gubun,
      종목명: name,
      티커: ticker,
      수량: qty,
      단가: price,
      수수료: fee,
      세금: tax,
    });
  }

  return { transactions, masterTokens, errorLines };
};

export const parseCashFlowsCsv = (text) => {
  const lines = splitCsvLines(text);
  const cashFlows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",").map((cell) => cell.trim());
    if (row.length < 3) continue;
    cashFlows.push({
      id: Date.now() + i,
      날짜: row[0],
      구분: row[1],
      금액: Number(row[2]) || 0,
      메모: row[3] || "",
    });
  }

  return cashFlows;
};

export const parseTransactionsCsv = (text, stockMaster) => {
  const lines = splitCsvLines(text);
  const transactions = [];
  const masterTokens = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",").map((cell) => cell.trim());
    if (row.length < 3) continue;

    const gubun = row[0];
    const date = row[1];
    const name = row[2];
    let ticker = row[3] || "";
    const qty = Number(row[4]) || 0;
    const price = Number(row[5]) || 0;
    const fee = Number(row[6]) || 0;
    const tax = Number(row[7]) || 0;

    if (!ticker) {
      const existing = stockMaster.find((stock) => stock.종목명 === name);
      ticker = existing ? existing.티커 : createAutoTicker();
    }

    if (
      !stockMaster.some((stock) => stock.티커 === ticker) &&
      !masterTokens.some((stock) => stock.티커 === ticker)
    ) {
      masterTokens.push({
        id: Date.now() + i + 950,
        티커: ticker,
        종목명: name,
        시장: inferMarket(ticker),
        섹터: "일반제조/서비스",
      });
    }

    transactions.push({
      id: Date.now() + i,
      구분: gubun,
      날짜: date,
      종목명: name,
      티커: ticker,
      수량: qty,
      단가: price,
      수수료: fee,
      세금: tax,
    });
  }

  return { transactions, masterTokens };
};

export const parseStockMasterCsv = (text, stockMaster) => {
  const lines = splitCsvLines(text);
  const tokens = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",").map((cell) => cell.trim());
    if (row.length < 2) continue;
    let ticker = row[0] || "";
    const name = row[1];
    if (!ticker) {
      ticker = createAutoTicker();
    }
    if (!stockMaster.some((stock) => stock.티커 === ticker)) {
      tokens.push({
        id: Date.now() + i,
        티커: ticker,
        종목명: name,
        시장: row[2] || "KOSPI",
        섹터: row[3] || "일반제조/서비스",
      });
    }
  }

  return tokens;
};
