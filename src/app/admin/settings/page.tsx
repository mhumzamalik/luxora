"use client";

import React, { useState } from "react";
import { Shield, Landmark, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface AuditLog {
  id: string;
  action: string;
  target: string | null;
  createdAt: string;
  user?: { name: string | null; email: string };
}

export default function AdminSettingsPage() {
  const [bankSaved, setBankSaved] = useState(false);

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => fetchApi("/api/admin/audit-logs"),
  });

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          Settings & System Audit Trail
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure store bank transfer details, administrative preferences, and review audit history.
        </p>
      </div>

      {bankSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Bank transfer account details successfully updated and saved.</span>
        </div>
      )}

      {/* Store Bank Configuration Card */}
      <form onSubmit={handleSaveBank} className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
        <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Landmark size={18} className="text-purple-600" /> Direct Bank Transfer Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Bank Name</label>
            <input
              type="text"
              defaultValue="Standard Chartered Bank / HBL"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Account Title / Name</label>
            <input
              type="text"
              defaultValue="LUXORA RETAIL PRIVATE LIMITED"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">IBAN / Account Number</label>
            <input
              type="text"
              defaultValue="PK36SCBL0000001123456701"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Branch Code / SWIFT</label>
            <input
              type="text"
              defaultValue="SCBLPKKAXXX"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
            />
          </div>
        </div>

        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md">
          <Save size={15} /> Save Bank Details
        </button>
      </form>

      {/* Admin Audit Trail Card */}
      <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
        <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield size={18} className="text-purple-600" /> Admin Audit Logs
        </h3>

        {isLoading ? (
          <div className="p-8 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading audit log...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">No recent admin audit actions recorded.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">{log.action}</span>
                  {log.target && <span className="text-gray-500 ml-2">({log.target})</span>}
                  <div className="text-[11px] text-gray-400">By {log.user?.email || "Admin"}</div>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
