import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user || null });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
