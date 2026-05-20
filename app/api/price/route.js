import { NextResponse } from "next/server";

const isForeignTicker = (code) =>
  code && (code.includes(":") || /^[A-Z]+$/.test(code));

const buildTickerCandidates = (rawCode) => {
  const raw = String(rawCode || "").trim();
  const dotNormalized = raw.split(".")[0];
  const colonNormalized = raw.includes(":") ? raw.split(":").pop() : raw;
  const foreign = isForeignTicker(raw);

  const candidates = foreign
    ? [raw, colonNormalized, dotNormalized]
    : [dotNormalized, raw];

  return [...new Set(candidates.filter(Boolean))];
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code");

  if (!rawCode) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  try {
    for (const code of buildTickerCandidates(rawCode)) {
      const response = await fetch(
        `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const price = data?.result?.areas?.[0]?.datas?.[0]?.nv;

      if (price !== undefined && price !== null) {
        return NextResponse.json({ code: rawCode, sourceCode: code, price });
      }
    }

    return NextResponse.json({ error: "Price not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
