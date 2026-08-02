import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    const result = id
      ? await db.execute({ sql: "SELECT * FROM uploads WHERE id = ?", args: [id] })
      : await db.execute("SELECT * FROM uploads ORDER BY id DESC LIMIT 1");

    const row = result.rows[0] as any;

    if (!row) {
      return NextResponse.json({ error: "No uploads yet" }, { status: 404 });
    }

    const parsed = JSON.parse(row.data as string);

    return NextResponse.json({
      id: row.id,
      filename: row.filename,
      uploaded_at: row.uploaded_at,
      blocks: parsed.blocks,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}