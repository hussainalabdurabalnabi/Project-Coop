"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type Block = { headers: string[]; rows: Record<string, any>[] };
type UploadSummary = { id: number; filename: string; uploaded_at: string };

const colors = ["#4f46e5", "#059669", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];

export default function DashboardClient() {
  const [status, setStatus] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filename, setFilename] = useState("");
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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
      setRawRows(data.rawRows || []);
    }
  }
  async function sendChatMessage() {
  const message = chatInput.trim();
  if (!message) return;

  setChatMessages((prev) => [...prev, { role: "user", text: message }]);
  setChatInput("");
  setChatLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, blocks, filename }),
    });
    const data = await res.json();

    if (data.error) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }]);
    } else {
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    }
  } catch {
    setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }]);
  } finally {
    setChatLoading(false);
  }
}

function handleChatKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChatMessage();
  }
}

  useEffect(() => {
    loadUploadsList().then((list) => {
      if (list && list.length > 0) loadData(String(list[0].id));
    });
  }, []);

  function uploadFile(file: File) {
  setStatus("Uploading...");
  setUploadProgress(0);

  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      setUploadProgress(Math.round((e.loaded / e.total) * 100));
    }
  });

  xhr.onload = async () => {
    setUploadProgress(null);
    if (xhr.status >= 200 && xhr.status < 300) {
      const result = JSON.parse(xhr.responseText);
      setStatus("Upload successful!");
      await loadUploadsList();
      await loadData(String(result.id));
    } else {
      const data = JSON.parse(xhr.responseText);
      setStatus("Error: " + data.error);
    }
  };

  xhr.onerror = () => {
    setUploadProgress(null);
    setStatus("Upload failed — check your connection");
  };

  xhr.open("POST", "/api/upload");
  xhr.send(formData);
}

function handleUpload(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const form = e.currentTarget;
  const fileInput = form.elements.namedItem("file") as HTMLInputElement;
  const file = fileInput.files?.[0];

  if (!file) {
    setStatus("Please choose a file first.");
    return;
  }

  uploadFile(file);
}

function handleDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  setIsDragging(false);
  const file = e.dataTransfer.files?.[0];
  if (file) uploadFile(file);
}

function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  setIsDragging(true);
}

function handleDragLeave() {
  setIsDragging(false);
}

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedId(id);
    loadData(id);
  }

  async function handleDelete() {
  if (!selectedId) return;
  if (!confirm("Delete this upload permanently?")) return;

  await fetch(`/api/data?id=${selectedId}`, { method: "DELETE" });

  const list = await loadUploadsList();
  if (list.length > 0) {
    loadData(String(list[0].id));
  } else {
    setBlocks([]);
    setFilename("");
    setSelectedId("");
  }
}
 return (
    <>
      <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 flex flex-col items-center gap-10"><div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Excel Graph Site
          </h1>
          <p className="text-slate-500 mt-2">
            Upload a report and see it visualized instantly
          </p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 flex flex-col gap-5">
          <div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors ${
    isDragging
      ? "border-indigo-400 bg-indigo-50"
      : "border-slate-200 bg-slate-50"
  }`}
>
  <p className="text-sm text-slate-500 text-center">
    Drag and drop an Excel file here, or
  </p>
  <form onSubmit={handleUpload} className="flex flex-col gap-3 items-center w-full">
    <input
      type="file"
      name="file"
      accept=".xlsx,.xls"
      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100"
    />
    <button
      type="submit"
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
    >
      Upload
    </button>
  </form>
</div>

{uploadProgress !== null && (
  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
    <div
      className="bg-indigo-600 h-full transition-all"
      style={{ width: `${uploadProgress}%` }}
    />
  </div>
)}

{status && (
  <p className="text-sm text-slate-500 text-center">{status}</p>
)}

          {uploads.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Previous uploads
              </label>
              <div className="flex gap-2 w-full min-w-0">
                <select
                  value={selectedId}
                  onChange={handleSelectChange}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex-1 min-w-0 bg-white"
                >
                  {uploads.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.filename} — {new Date(u.uploaded_at).toLocaleString()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDelete}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {blocks.length > 0 && (
  <div className="w-full max-w-6xl">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">
      {filename}
    </h2>

    {rawRows.length > 0 && (
      <div className="mb-8 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <button
          onClick={() => setViewerOpen(!viewerOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            View raw sheet data
          </span>
          <span className="text-slate-400 text-sm">
            {viewerOpen ? "Collapse ▲" : "Expand ▼"}
          </span>
        </button>

        {viewerOpen && (
          <div className="overflow-auto max-h-96 border-t border-slate-100">
            <table className="min-w-full text-sm">
              <tbody>
                {rawRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        className="px-3 py-1.5 border-b border-r border-slate-200 text-slate-600 whitespace-nowrap"                    
                        >
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blocks.map((block, i) => {
              const labelKey = block.headers[0];
              const rows = block.rows.filter(
                (r) => String(r[labelKey]).trim().toLowerCase() !== "total"
              );
              if (rows.length === 0) return null;

              const numericKeys = block.headers.filter(
                (h) => h !== labelKey && typeof rows[0][h] === "number"
              );

              // Look for a "percent" style column (e.g. "Pass %") for a trend line
              const percentKey = numericKeys.find((h) => h.toLowerCase().includes("%"));

              // Build totals across all rows for a composition pie chart
              // (skip the percent column itself, that's not something you sum)
              const pieKeys = numericKeys.filter((h) => h !== percentKey);
              const pieData = pieKeys
                .map((h) => ({
                  name: h,
                  value: rows.reduce((sum, r) => sum + (Number(r[h]) || 0), 0),
                }))
                .filter((d) => d.value > 0);

              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6"
                >
                  <h3 className="text-sm font-semibold mb-5 text-slate-700 uppercase tracking-wide">
                    Report Block {i + 1}
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={rows} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={labelKey} stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        wrapperStyle={{ zIndex: 50 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {numericKeys.map((key, idx) => (
                        <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>

                  {pieData.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold mt-6 mb-3 text-slate-500 uppercase tracking-wide">
                        Overall breakdown
                      </h4>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={({ name, percent }) =>
                              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                          >
                            {pieData.map((_, idx) => (
                              <Cell key={idx} fill={colors[idx % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e2e8f0" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  )}

                  {percentKey && rows.length > 1 && (
                    <>
                      <h4 className="text-xs font-semibold mt-6 mb-3 text-slate-500 uppercase tracking-wide">
                        {percentKey} trend
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey={labelKey} stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e2e8f0" }}
                          />
                          <Line
                            type="monotone"
                            dataKey={percentKey}
                            stroke={colors[0]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>

    <button
      onClick={() => setChatOpen(!chatOpen)}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center text-2xl transition z-50"
    >
      {chatOpen ? "✕" : "💬"}
    </button>

    {chatOpen && (
      <div className="fixed bottom-24 right-6 w-80 h-96 bg-white border border-slate-200 shadow-xl rounded-2xl flex flex-col overflow-hidden z-50">
        <div className="bg-indigo-600 text-white px-4 py-3 text-sm font-semibold">
          Report Assistant
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chatMessages.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-4">
              Ask me anything about the loaded report.
            </p>
          )}
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
                m.role === "user"
                  ? "bg-indigo-600 text-white self-end"
                  : "bg-slate-100 text-slate-700 self-start"
              }`}
            >
              <div
  key={i}
  className={`text-sm px-3 py-2 rounded-lg max-w-[85%] prose prose-sm ${
    m.role === "user"
      ? "bg-indigo-600 text-white self-end prose-invert"
      : "bg-slate-100 text-slate-700 self-start"
  }`}
>
  <ReactMarkdown>{m.text}</ReactMarkdown>
</div>
            </div>
          ))}
          {chatLoading && (
            <div className="text-sm px-3 py-2 rounded-lg bg-slate-100 text-slate-400 self-start">
              Thinking...
            </div>
          )}
        </div>

        <div className="flex border-t border-slate-100">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={sendChatMessage}
            className="px-4 text-indigo-600 font-medium text-sm"
          >
            Send
          </button>
        </div>
      </div>
    )}
  </>
  );
}
