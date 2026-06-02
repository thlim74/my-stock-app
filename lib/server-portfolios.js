export const DEFAULT_PORTFOLIO_ID = "default";
export const DEFAULT_PORTFOLIO = {
  id: DEFAULT_PORTFOLIO_ID,
  name: "기본 포트폴리오",
  builtIn: true,
  ownerUserId: null,
  userIds: [],
};

const PORTFOLIO_REGISTRY_STATE_ID = "__portfolios__";

export const toPortfolioStateId = (portfolioId) => {
  const normalized = String(portfolioId || DEFAULT_PORTFOLIO_ID).trim();
  if (!normalized || normalized === DEFAULT_PORTFOLIO_ID) {
    return DEFAULT_PORTFOLIO_ID;
  }
  return `portfolio:${normalized}`;
};

const normalizePortfolio = (item) => {
  const id = String(item?.id || "").trim();
  const name = String(item?.name || "").trim();
  if (!id || id === DEFAULT_PORTFOLIO_ID || !name) return null;

  return {
    id,
    name,
    builtIn: false,
    ownerUserId: item?.ownerUserId || item?.owner_user_id || null,
    userIds: Array.isArray(item?.userIds)
      ? item.userIds.map(String)
      : Array.isArray(item?.user_ids)
        ? item.user_ids.map(String)
        : [],
    createdAt: item?.createdAt || item?.created_at || null,
    updatedAt: item?.updatedAt || item?.updated_at || null,
  };
};

const isMissingTableError = (message, table) =>
  message?.includes("Could not find the table") && message?.includes(table);

export const loadPortfolioRegistry = async (supabase) => {
  const { data, error } = await supabase
    .from("app_state")
    .select("stock_master")
    .eq("id", PORTFOLIO_REGISTRY_STATE_ID)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message, "app_state")) return [];
    throw new Error(`Failed to load portfolios: ${error.message}`);
  }

  return Array.isArray(data?.stock_master)
    ? data.stock_master.map(normalizePortfolio).filter(Boolean)
    : [];
};

export const savePortfolioRegistry = async (supabase, portfolios) => {
  const payload = {
    id: PORTFOLIO_REGISTRY_STATE_ID,
    transactions: [],
    cash_flows: [],
    stock_master: portfolios.map(normalizePortfolio).filter(Boolean),
    cash_adjustment: 0,
  };

  let { error } = await supabase.from("app_state").upsert(payload);

  if (error && error.message?.includes("cash_adjustment")) {
    const fallbackPayload = {
      id: payload.id,
      transactions: payload.transactions,
      cash_flows: payload.cash_flows,
      stock_master: payload.stock_master,
    };
    ({ error } = await supabase.from("app_state").upsert(fallbackPayload));
  }

  if (error) {
    throw new Error(`Failed to save portfolios: ${error.message}`);
  }

  return payload.stock_master;
};

export const getVisiblePortfolios = (user, registry) => {
  if (!user) return [];
  const custom = Array.isArray(registry) ? registry : [];
  const visible =
    user.role === "admin"
      ? custom
      : custom.filter(
          (portfolio) =>
            portfolio.ownerUserId === user.id || portfolio.userIds.includes(user.id),
        );

  return [DEFAULT_PORTFOLIO, ...visible];
};

export const findPortfolio = (registry, portfolioId) => {
  const normalized = String(portfolioId || DEFAULT_PORTFOLIO_ID);
  if (normalized === DEFAULT_PORTFOLIO_ID) return DEFAULT_PORTFOLIO;
  return (registry || []).find((portfolio) => portfolio.id === normalized) || null;
};

export const canAccessPortfolio = (user, registry, portfolioId) => {
  if (!user) return false;
  if (!portfolioId || portfolioId === DEFAULT_PORTFOLIO_ID) return true;
  if (user.role === "admin") return true;

  const portfolio = findPortfolio(registry, portfolioId);
  return Boolean(
    portfolio &&
      (portfolio.ownerUserId === user.id || portfolio.userIds.includes(user.id)),
  );
};
