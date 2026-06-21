const AUTH_SECURITY_STATE_ID = "__auth_security__";
export const AUTH_LOCK_THRESHOLD = 5;

const normalizeUsername = (username) => String(username || "").trim().toLowerCase();

const normalizeRecord = (record) => {
  const username = normalizeUsername(record?.username);
  if (!username) return null;
  return {
    username,
    userId: record?.userId || record?.user_id || null,
    failedCount: Number(record?.failedCount || record?.failed_count || 0),
    locked: Boolean(record?.locked),
    lockedAt: record?.lockedAt || record?.locked_at || null,
    lastFailedAt: record?.lastFailedAt || record?.last_failed_at || null,
    unlockedAt: record?.unlockedAt || record?.unlocked_at || null,
    unlockedBy: record?.unlockedBy || record?.unlocked_by || null,
  };
};

const isMissingTableError = (message, table) =>
  message?.includes("Could not find the table") && message?.includes(table);

export const getRequestCountry = (request) =>
  String(request.headers.get("x-vercel-ip-country") || "").trim().toUpperCase();

export const shouldBlockForeignIp = (request) => {
  const country = getRequestCountry(request);
  // Local development and some proxy paths do not include the Vercel country header.
  if (!country) return false;
  return country !== "KR";
};

export const loadAuthSecurityRegistry = async (supabase) => {
  const { data, error } = await supabase
    .from("app_state")
    .select("stock_master")
    .eq("id", AUTH_SECURITY_STATE_ID)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message, "app_state")) return [];
    throw new Error(`Failed to load auth security state: ${error.message}`);
  }

  return Array.isArray(data?.stock_master)
    ? data.stock_master.map(normalizeRecord).filter(Boolean)
    : [];
};

export const saveAuthSecurityRegistry = async (supabase, records) => {
  const payload = {
    id: AUTH_SECURITY_STATE_ID,
    transactions: [],
    cash_flows: [],
    stock_master: records.map(normalizeRecord).filter(Boolean),
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
    throw new Error(`Failed to save auth security state: ${error.message}`);
  }

  return payload.stock_master;
};

export const findAuthSecurityRecord = (records, username) =>
  (records || []).find((record) => record.username === normalizeUsername(username)) || null;

export const recordFailedLogin = async (supabase, { username, userId }) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const registry = await loadAuthSecurityRegistry(supabase);
  const current = findAuthSecurityRecord(registry, normalized);
  const failedCount = (current?.failedCount || 0) + 1;
  const locked = failedCount >= AUTH_LOCK_THRESHOLD;
  const now = new Date().toISOString();
  const nextRecord = {
    ...(current || {}),
    username: normalized,
    userId: userId || current?.userId || null,
    failedCount,
    locked,
    lockedAt: locked ? current?.lockedAt || now : current?.lockedAt || null,
    lastFailedAt: now,
  };
  const nextRegistry = current
    ? registry.map((record) => (record.username === normalized ? nextRecord : record))
    : [...registry, nextRecord];

  await saveAuthSecurityRegistry(supabase, nextRegistry);
  return nextRecord;
};

export const clearAuthSecurityForUser = async (supabase, { username, userId, unlockedBy }) => {
  const normalized = normalizeUsername(username);
  const registry = await loadAuthSecurityRegistry(supabase);
  const now = new Date().toISOString();
  const nextRegistry = registry.map((record) => {
    const matchesUsername = normalized && record.username === normalized;
    const matchesUserId = userId && record.userId === userId;
    if (!matchesUsername && !matchesUserId) return record;
    return {
      ...record,
      failedCount: 0,
      locked: false,
      lockedAt: null,
      unlockedAt: now,
      unlockedBy: unlockedBy || null,
    };
  });
  await saveAuthSecurityRegistry(supabase, nextRegistry);
};
