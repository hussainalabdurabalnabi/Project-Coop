import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);

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

      const isTotalRow = /total/i.test(String(label).trim());

      if (isTotalRow) break; // stop the table here, don't save this row

      const entry: Record<string, any> = {};
      headers.forEach((h, k) => {
        entry[h] = dr[typeColIndex + k] ?? "";
      });
        dataRows.push(entry);
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

    const result = await db.execute({
      sql: "INSERT INTO uploads (filename, uploaded_at, data) VALUES (?, ?, ?)",
      args: [file.name, new Date().toISOString(), JSON.stringify({ blocks })],
    });

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}