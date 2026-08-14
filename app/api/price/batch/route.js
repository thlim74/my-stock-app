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

const fetchPrice = async (rawCode) => {
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
      return { code: rawCode, sourceCode: code, price: Number(price), ok: true };
    }
  }

  return { code: rawCode, error: "Price not found", ok: false };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const codes = Array.isArray(body?.codes)
      ? [...new Set(body.codes.map((code) => String(code || "").trim()).filter(Boolean))]
      : [];

    if (codes.length === 0) {
      return NextResponse.json({ prices: [] });
    }

    const prices = await Promise.all(codes.map(fetchPrice));
    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
