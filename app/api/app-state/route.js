import { NextResponse } from "next/server";
import { getCurrentUser, getServerSupabase } from "@/lib/server-auth";
import {
  canAccessPortfolio,
  DEFAULT_PORTFOLIO_ID,
  loadPortfolioRegistry,
  toPortfolioStateId,
} from "@/lib/server-portfolios";

const isMissingTableError = (message, table) =>
  message?.includes("Could not find the table") && message?.includes(table);

const getPortfolioId = (request) => {
  const { searchParams } = new URL(request.url);
  return String(searchParams.get("portfolioId") || DEFAULT_PORTFOLIO_ID).trim();
};

const buildEmptyState = (source = "empty") => ({
  transactions: null,
  cashFlows: null,
  stockMaster: null,
  cashAdjustment: 0,
  source,
});

const assertPortfolioAccess = async (supabase, user, portfolioId) => {
  const registry = await loadPortfolioRegistry(supabase);
  if (!canAccessPortfolio(user, registry, portfolioId)) {
    const error = new Error("포트폴리오 접근 권한이 없습니다.");
    error.status = 403;
    throw error;
  }
};

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const portfolioId = getPortfolioId(request);
    const appStateId = toPortfolioStateId(portfolioId);
    const supabase = getServerSupabase();
    await assertPortfolioAccess(supabase, user, portfolioId);

    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from("app_state")
      .select("transactions, cash_flows, stock_master, cash_adjustment")
      .eq("id", appStateId)
      .maybeSingle());

    if (error && error.message?.includes("cash_adjustment")) {
      ({ data, error } = await supabase
        .from("app_state")
        .select("transactions, cash_flows, stock_master")
        .eq("id", appStateId)
        .maybeSingle());
    }

    if (error) {
      if (isMissingTableError(error.message, "app_state")) {
        return NextResponse.json(buildEmptyState("missing-table"));
      }

      throw new Error(`Failed to load app state: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(buildEmptyState("empty"));
    }

    return NextResponse.json({
      transactions: data.transactions || [],
      cashFlows: data.cash_flows || [],
      stockMaster: data.stock_master || [],
      cashAdjustment:
        typeof data.cash_adjustment === "number" ? data.cash_adjustment : 0,
      portfolioId,
      source: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: error.status || 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const portfolioId = getPortfolioId(request);
    const appStateId = toPortfolioStateId(portfolioId);
    const supabase = getServerSupabase();
    await assertPortfolioAccess(supabase, user, portfolioId);

    const body = await request.json();
    const payload = {
      id: appStateId,
      transactions: Array.isArray(body?.transactions) ? body.transactions : [],
      cash_flows: Array.isArray(body?.cashFlows) ? body.cashFlows : [],
      stock_master: Array.isArray(body?.stockMaster) ? body.stockMaster : [],
      cash_adjustment:
        typeof body?.cashAdjustment === "number" ? body.cashAdjustment : 0,
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
      if (isMissingTableError(error.message, "app_state")) {
        return NextResponse.json({
          success: false,
          source: "missing-table",
          message: "app_state 테이블이 없어 원격 저장을 건너뜁니다.",
        });
      }

      throw new Error(`Failed to save app state: ${error.message}`);
    }

    return NextResponse.json({ success: true, portfolioId, source: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: error.status || 500 },
    );
  }
}
