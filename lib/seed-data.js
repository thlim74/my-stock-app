export const TODAY = "2026-05-18";

export const BASE_TICKS = {
  kospi: 7490.0,
  kosdaq: 1120.0,
  dow: 39500.0,
  nasdaq: 16300.0,
  sp500: 5200.0,
  exchangeRate: 1500.0,
};

export const INITIAL_LIVE_TICKS = {
  kospi: 7492.49,
  kosdaq: 1122.57,
  dow: 39545.8,
  nasdaq: 16322.4,
  sp500: 5208.1,
  exchangeRate: 1501.2,
};

export const DEFAULT_STOCK_PRICES = {
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
  "005930": 270500,
  "000660": 1819000,
};

export const STORAGE_KEYS = {
  TX: "ultimate_v39_11_tx_secured",
  CASH: "ultimate_v39_11_cash_secured",
  MASTER: "ultimate_v39_11_master_secured",
};

export const INITIAL_STOCK_MASTER = [
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
];

export const createInitialTx = (today) => ({
  날짜: today,
  구분: "매수",
  종목명: "",
  티커: "",
  수량: "",
  단가: "",
  수수료: "0",
  세금: "0",
});

export const createInitialCash = (today) => ({
  날짜: today,
  구분: "입금",
  금액: "",
  메모: "",
});

export const createInitialStock = () => ({
  티커: "",
  종목명: "",
  시장: "KOSPI",
  섹터: "일반제조/서비스",
});

export const createInitialManualPriceForm = () => ({
  티커: "",
  가격: "",
});
