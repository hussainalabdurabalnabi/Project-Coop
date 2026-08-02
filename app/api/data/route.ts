import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    const row = id
      ? (db.prepare("SELECT * FROM uploads WHERE id = ?").get(id) as any)
      : (db.prepare("SELECT * FROM uploads ORDER BY id DESC LIMIT 1").get() as any);

    if (!row) {
      return NextResponse.json({ error: "No uploads yet" }, { status: 404 });
    }

    const parsed = JSON.parse(row.data);

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