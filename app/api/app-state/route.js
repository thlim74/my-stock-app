import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const APP_STATE_ID = "default";

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, anonKey);
};

const isMissingTableError = (message, table) =>
  message?.includes("Could not find the table") && message?.includes(table);

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from("app_state")
      .select("transactions, cash_flows, stock_master, cash_adjustment")
      .eq("id", APP_STATE_ID)
      .maybeSingle());

    if (error && error.message?.includes("cash_adjustment")) {
      ({ data, error } = await supabase
        .from("app_state")
        .select("transactions, cash_flows, stock_master")
        .eq("id", APP_STATE_ID)
        .maybeSingle());
    }

    if (error) {
      if (isMissingTableError(error.message, "app_state")) {
        return NextResponse.json({
          transactions: null,
          cashFlows: null,
          stockMaster: null,
          source: "missing-table",
        });
      }

      throw new Error(`Failed to load app state: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json({
        transactions: null,
        cashFlows: null,
        stockMaster: null,
        source: "empty",
      });
    }

    return NextResponse.json({
      transactions: data.transactions || [],
      cashFlows: data.cash_flows || [],
      stockMaster: data.stock_master || [],
      cashAdjustment:
        typeof data.cash_adjustment === "number" ? data.cash_adjustment : 0,
      source: "supabase",
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
    const supabase = getSupabaseClient();
    const body = await request.json();

    const payload = {
      id: APP_STATE_ID,
      transactions: Array.isArray(body?.transactions) ? body.transactions : [],
      cash_flows: Array.isArray(body?.cashFlows) ? body.cashFlows : [],
      stock_master: Array.isArray(body?.stockMaster) ? body.stockMaster : [],
      cash_adjustment:
        typeof body?.cashAdjustment === "number" ? body.cashAdjustment : 0,
    };

    let { error } = await supabase.from("app_state").upsert(payload);

    if (error && error.message?.includes("cash_adjustment")) {
      const fallbackPayload = {
        id: APP_STATE_ID,
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

    return NextResponse.json({ success: true, source: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
