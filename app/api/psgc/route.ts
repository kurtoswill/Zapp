import { NextResponse } from "next/server";

const PSGC_BASE = "https://psgc.gitlab.io/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const level = url.searchParams.get("level");
  const code = url.searchParams.get("code");

  if (!level) {
    return NextResponse.json({ error: "Missing level" }, { status: 400 });
  }

  let targetPath = "";

  if (level === "regions") {
    targetPath = "/regions/";
  } else if (level === "provinces") {
    if (!code) return NextResponse.json({ error: "Missing region code" }, { status: 400 });
    targetPath = `/regions/${encodeURIComponent(code)}/provinces/`;
  } else if (level === "cities-municipalities") {
    if (!code) return NextResponse.json({ error: "Missing province code" }, { status: 400 });
    targetPath = `/provinces/${encodeURIComponent(code)}/cities-municipalities/`;
  } else if (level === "barangays") {
    if (!code) return NextResponse.json({ error: "Missing city code" }, { status: 400 });
    targetPath = `/cities-municipalities/${encodeURIComponent(code)}/barangays/`;
  } else {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const res = await fetch(`${PSGC_BASE}${targetPath}`);
  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `PSGC API error ${res.status}`, detail: body }, { status: 502 });
  }

  const data = await res.json();

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
    },
  });
}
