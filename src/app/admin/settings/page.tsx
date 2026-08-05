"use client";

import React, { useState } from "react";
import { Shield, Landmark, Save, Clock, Loader2 } from "lucide-react";
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
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-serif font-extrabold text-white">
          Settings & Audit Trail
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure store bank transfer details and review system audit history.
        </p>
      </div>

      {bankSaved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold">
          Bank details successfully saved.
        </div>
      )}

      {/* Store Bank Configuration Card */}
      <form onSubmit={handleSaveBank} className="bg-[#161722] border border-white/10 p-6 rounded-3xl space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Landmark size={18} className="text-purple-400" /> Bank Transfer Account Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-gray-300 block mb-1">Bank Name</label>
            <input
              type="text"
              defaultValue="Luxora National Bank"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">Account Name</label>
            <input
              type="text"
              defaultValue="LUXORA RETAIL GROUP INC"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">Account Number</label>
            <input
              type="text"
              defaultValue="1092-8837-4412-9901"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">SWIFT / BIC Code</label>
            <input
              type="text"
              defaultValue="LUXUS33XXX"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden font-mono"
            />
          </div>
        </div>

        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2">
          <Save size={15} /> Save Bank Settings
        </button>
      </form>

      {/* Admin Audit Trail Card */}
      <div className="bg-[#161722] border border-white/10 p-6 rounded-3xl space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield size={18} className="text-emerald-400" /> Admin Audit Logs
        </h3>

        {isLoading ? (
          <div className="p-8 flex justify-center text-purple-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading audit history...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-white/5">
            {auditLogs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-purple-400 block">{log.action}</span>
                  <span className="text-gray-300">
                    {log.target ? `${log.target} by ` : ""}
                    {log.user?.email || "System Admin"}
                  </span>
                </div>
                <span className="text-gray-500 text-[11px] flex items-center gap-1">
                  <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
