import { NextResponse } from "next/server";

const normalize = (value: string) =>
  value.replace(/[\s/\-_.]/g, "").toLowerCase();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const submitted =
    body && typeof body.password === "string" ? body.password : "";

  const expected = "03052026";

  const ok = normalize(submitted) === normalize(expected);

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    name: "Hiếu Phạm",
  });
}
