"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type Block = { headers: string[]; rows: Record<string, any>[] };
type UploadSummary = { id: number; filename: string; uploaded_at: string };

const colors = ["#4f46e5", "#059669", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];

export default function Home() {
  const [status, setStatus] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filename, setFilename] = useState("");
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  async function loadUploadsList() {
    const res = await fetch("/api/uploads");
    const data = await res.json();
    if (!data.error) setUploads(data.uploads);
    return data.uploads;
  }

  async function loadData(id?: string) {
    const url = id ? `/api/data?id=${id}` : "/api/data";
    const res = await fetch(url);
    const data = await res.json();
    if (!data.error) {
      setBlocks(data.blocks);
      setFilename(data.filename);
      setSelectedId(String(data.id));
    }
  }

  useEffect(() => {
    loadUploadsList().then((list) => {
      if (list && list.length > 0) loadData(String(list[0].id));
    });
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });

    if (res.ok) {
      const result = await res.json();
      setStatus("Upload successful!");
      await loadUploadsList();
      await loadData(String(result.id));
    } else {
      const data = await res.json();
      setStatus("Error: " + data.error);
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedId(id);
    loadData(id);
  }

  return (
    <main className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex flex-col items-center gap-10">
      <div className="bg-white shadow-lg rounded-xl p-10 flex flex-col items-center gap-4 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700">Excel Graph Site</h1>
        <form onSubmit={handleUpload} className="flex flex-col gap-3 items-center">
          <input type="file" name="file" accept=".xlsx,.xls" className="text-gray-700" />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Upload
          </button>
        </form>
        <p className="text-gray-600">{status}</p>

        {uploads.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm text-gray-500">Previous uploads</label>
            <select
              value={selectedId}
              onChange={handleSelectChange}
              className="border rounded-lg px-3 py-2 text-gray-700"
            >
              {uploads.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.filename} — {new Date(u.uploaded_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {blocks.length > 0 && (
        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">
            Dashboard: {filename}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blocks.map((block, i) => {
              const labelKey = block.headers[0];
              const rows = block.rows.filter(
                (r) => String(r[labelKey]).trim().toLowerCase() !== "total"
              );
              if (rows.length === 0) return null;

              const numericKeys = block.headers.filter(
                (h) => h !== labelKey && typeof rows[0][h] === "number"
              );

              return (
                <div key={i} className="bg-white shadow-md rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-800">
                    Report Block {i + 1}
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={rows} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey={labelKey} stroke="#4b5563" />
                      <YAxis stroke="#4b5563" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}
                        wrapperStyle={{ zIndex: 50 }}
                      />
                      <Legend />
                      {numericKeys.map((key, idx) => (
                        <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}