import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "stockapp_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const getAuthSecret = () => {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    return process.env.AUTH_SECRET;
  }
  const fallback = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dev-only-secret";
  return `fallback-${fallback}`;
};

export const hashPassword = (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(plain, salt, 120000, 64, "sha512").toString("hex");
  return `pbkdf2$120000$${salt}$${digest}`;
};

export const verifyPassword = (plain, encoded) => {
  if (!encoded || typeof encoded !== "string") return false;
  const [algo, iterRaw, salt, digest] = encoded.split("$");
  if (algo !== "pbkdf2" || !iterRaw || !salt || !digest) return false;
  const iterations = Number(iterRaw);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;

  const candidate = crypto
    .pbkdf2Sync(plain, salt, iterations, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(digest));
};

const sign = (value) =>
  crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");

export const buildSessionToken = ({ id, username, role }) => {
  const payload = {
    id,
    username,
    role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadText = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadText);
  return `${payloadText}.${signature}`;
};

export const parseSessionToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadText, signature] = token.split(".");
  if (!payloadText || !signature) return null;
  const expected = sign(payloadText);
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadText, "base64url").toString("utf8"));
    if (!payload?.id || !payload?.role || !payload?.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch (_error) {
    return null;
  }
};

export const setSessionCookie = async (sessionToken) => {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
};

export const getSessionPayload = async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value || "";
  return parseSessionToken(raw);
};

export const ensureUsersTable = async (supabase) => {
  const { error } = await supabase
    .from("app_users")
    .select("id")
    .limit(1);

  if (error) {
    const missing =
      error.message?.includes("Could not find the table") &&
      error.message?.includes("app_users");
    if (missing) {
      throw new Error(
        "app_users 테이블이 없습니다. supabase/sql/create_app_users.sql을 먼저 실행하세요.",
      );
    }
    throw new Error(`Failed to access app_users: ${error.message}`);
  }
};

export const getCurrentUser = async () => {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const supabase = getSupabaseClient();
  await ensureUsersTable(supabase);
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, display_name, role, is_active, last_login_at")
    .eq("id", payload.id)
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return null;
  }
  return data;
};

export const requireAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  if (user.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return user;
};

export const getServerSupabase = () => getSupabaseClient();
