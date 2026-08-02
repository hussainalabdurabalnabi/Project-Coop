import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);

// Scans the raw sheet for repeating "Type" header rows and pulls out
// each mini-table underneath them (matches the QA regression report
// format: a "Type" header row, data rows below, ending at "Total").
function extractBlocks(rawRows: any[][]) {
  const blocks: { headers: string[]; rows: Record<string, any>[] }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const typeColIndex = row.findIndex(
      (cell) => String(cell).trim() === "Type"
    );
    if (typeColIndex === -1) continue;

    const headers: string[] = [];
    for (let c = typeColIndex; c < row.length; c++) {
      const val = row[c];
      if (val === undefined || val === "") break;
      headers.push(String(val).trim());
    }
    if (headers.length < 2) continue;

    const dataRows: Record<string, any>[] = [];
    for (let j = i + 1; j < rawRows.length; j++) {
      const dr = rawRows[j] || [];
      const label = dr[typeColIndex];

      if (label === undefined || label === "") break;
      if (String(label).trim() === "Type") break;

      const entry: Record<string, any> = {};
      headers.forEach((h, k) => {
        entry[h] = dr[typeColIndex + k] ?? "";
      });
      dataRows.push(entry);

      if (String(label).trim().toLowerCase() === "total") break;
    }

    if (dataRows.length > 0) {
      blocks.push({ headers, rows: dataRows });
    }
  }

  return blocks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    const blocks = extractBlocks(rawRows);

    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find any recognizable report tables in this sheet" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(
      "INSERT INTO uploads (filename, uploaded_at, data) VALUES (?, ?, ?)"
    );
    const result = stmt.run(
      file.name,
      new Date().toISOString(),
      JSON.stringify({ blocks })
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}