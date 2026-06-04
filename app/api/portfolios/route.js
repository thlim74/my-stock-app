import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser, getServerSupabase } from "@/lib/server-auth";
import {
  DEFAULT_PORTFOLIO_ID,
  findPortfolio,
  getVisiblePortfolios,
  loadPortfolioRegistry,
  savePortfolioRegistry,
  toPortfolioStateId,
} from "@/lib/server-portfolios";

const sanitizeName = (value) => String(value || "").trim().slice(0, 40);

const createEmptyPortfolioState = async (supabase, portfolioId) => {
  const payload = {
    id: toPortfolioStateId(portfolioId),
    transactions: [],
    cash_flows: [],
    stock_master: [],
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
    throw new Error(`Failed to initialize portfolio state: ${error.message}`);
  }
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getServerSupabase();
    const registry = await loadPortfolioRegistry(supabase);
    return NextResponse.json({
      portfolios: getVisiblePortfolios(user, registry),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "관리자만 포트폴리오를 추가할 수 있습니다." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = sanitizeName(body?.name);
    if (!name) {
      return NextResponse.json({ error: "포트폴리오 이름을 입력하세요." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const portfolio = {
      id: crypto.randomUUID(),
      name,
      builtIn: false,
      ownerUserId: user.id,
      userIds: [user.id],
      createdAt: now,
      updatedAt: now,
    };

    const supabase = getServerSupabase();
    const registry = await loadPortfolioRegistry(supabase);
    const nextRegistry = await savePortfolioRegistry(supabase, [...registry, portfolio]);
    await createEmptyPortfolioState(supabase, portfolio.id);

    return NextResponse.json({
      success: true,
      portfolio,
      portfolios: getVisiblePortfolios(user, nextRegistry),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    if (!id || id === DEFAULT_PORTFOLIO_ID) {
      return NextResponse.json(
        { error: "기본 포트폴리오는 수정할 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    const registry = await loadPortfolioRegistry(supabase);
    const target = findPortfolio(registry, id);
    if (!target) {
      return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });
    }

    const isOwner = target.ownerUserId === user.id;
    const isAdmin = user.role === "admin";
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "포트폴리오 수정 권한이 없습니다." }, { status: 403 });
    }

    const nextRegistry = registry.map((portfolio) => {
      if (portfolio.id !== id) return portfolio;

      const nextName = body?.name !== undefined ? sanitizeName(body.name) : portfolio.name;
      return {
        ...portfolio,
        name: nextName || portfolio.name,
        userIds: isAdmin && Array.isArray(body?.userIds)
          ? [...new Set(body.userIds.map(String))]
          : portfolio.userIds,
        updatedAt: new Date().toISOString(),
      };
    });

    const saved = await savePortfolioRegistry(supabase, nextRegistry);
    return NextResponse.json({
      success: true,
      portfolios: getVisiblePortfolios(user, saved),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id || id === DEFAULT_PORTFOLIO_ID) {
      return NextResponse.json(
        { error: "기본 포트폴리오는 삭제할 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    const registry = await loadPortfolioRegistry(supabase);
    const target = findPortfolio(registry, id);
    if (!target) {
      return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });
    }

    if (user.role !== "admin" && target.ownerUserId !== user.id) {
      return NextResponse.json({ error: "포트폴리오 삭제 권한이 없습니다." }, { status: 403 });
    }

    const saved = await savePortfolioRegistry(
      supabase,
      registry.filter((portfolio) => portfolio.id !== id),
    );

    return NextResponse.json({
      success: true,
      portfolios: getVisiblePortfolios(user, saved),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
