import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));

export async function GET() {
  try {
    const rows = db
      .prepare("SELECT id, filename, uploaded_at FROM uploads ORDER BY id DESC")
      .all();

    return NextResponse.json({ uploads: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load uploads" }, { status: 500 });
  }
}