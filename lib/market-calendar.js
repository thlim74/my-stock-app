import { isForeignMarket } from "@/lib/market-utils";

const KRX_FULL_HOLIDAYS = new Set([
  "2025-12-25",
  "2025-12-31",
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-02",
  "2026-05-01",
  "2026-05-05",
  "2026-05-25",
  "2026-08-17",
  "2026-09-24",
  "2026-09-25",
  "2026-10-05",
  "2026-10-09",
  "2026-12-25",
  "2026-12-31",
]);

const US_FULL_HOLIDAYS = new Set([
  "2025-11-27",
  "2025-12-25",
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
]);

const isWeekend = (dateText) => {
  const date = new Date(`${dateText}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isMarketHoliday = ({ date, market, ticker }) => {
  if (!date) return false;
  if (isWeekend(date)) return true;
  return isForeignMarket(market, ticker)
    ? US_FULL_HOLIDAYS.has(date)
    : KRX_FULL_HOLIDAYS.has(date);
};

