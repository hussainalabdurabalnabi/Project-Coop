"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type Block = { headers: string[]; rows: Record<string, any>[] };

export default function Dashboard() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBlocks(data.blocks);
          setFilename(data.filename);
        }
      });
  }, []);

  if (error) return <p className="p-8">{error}</p>;
  if (blocks.length === 0) return <p className="p-8">Loading...</p>;

  const colors = ["#4f46e5", "#059669", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];

  return (
    <main className="p-8 flex flex-col gap-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700">Dashboard: {filename}</h1>

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
            <h2 className="text-lg font-semibold mb-6 text-gray-800">
                Report Block {i + 1}
            </h2>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={rows} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={labelKey} stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }} wrapperStyle={{ zIndex: 50 }} />
                <Legend />
                {numericKeys.map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </main>
  );
}