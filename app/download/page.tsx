"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function DownloadPage() {
  const apkUrl = "https://project-coop-peach.vercel.app/excel-graph-site.apk";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 flex flex-col items-center gap-4">
       <Link
  href="/"
  className="text-indigo-600 hover:underline text-sm self-start"
>
  ← Back to dashboard
</Link>
<h1 className="text-2xl font-bold text-slate-900">Get the Android App</h1>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Scan this QR code with your phone to download and install the app
        </p>
        <QRCodeSVG value={apkUrl} size={220} />
        <a
          href={apkUrl}
          className="text-indigo-600 hover:underline text-sm"
        >
          Or download directly
        </a>
      </div>
    </main>
  );
}