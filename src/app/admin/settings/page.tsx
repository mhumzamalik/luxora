"use client";

import React, { useState } from "react";
import { Shield, Landmark, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";

interface AuditLog {
  id: string;
  action: string;
  target?: string | null;
  details?: string | null;
  createdAt: string;
  user?: { name: string | null; email: string };
}

interface BankSettings {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string | null;
  iban: string;
  branchCode: string | null;
  instructions: string | null;
  updatedAt: string;
}

interface BankSettingsResponse {
  success: boolean;
  settings: BankSettings;
}

function BankSettingsForm({
  initialSettings,
  onSuccess,
}: {
  initialSettings: BankSettings;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    bankName: initialSettings.bankName || "",
    accountTitle: initialSettings.accountTitle || "",
    accountNumber: initialSettings.accountNumber || "",
    iban: initialSettings.iban || "",
    branchCode: initialSettings.branchCode || "",
    instructions: initialSettings.instructions || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      const res = await fetchApi<BankSettingsResponse>("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.success) {
        toastSuccess("Settings Saved", "Bank transfer details updated successfully.");
        await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
        await queryClient.invalidateQueries({ queryKey: ["bank-details"] });
        await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update bank details";
      setErrorMessage(msg);
      toastError("Save Failed", msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveBank}
      className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs"
    >
      <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Landmark size={18} className="text-purple-600" /> Direct Bank Transfer Configuration
      </h3>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-gray-700 block mb-1">
            Bank Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g. Meezan Bank Ltd / Standard Chartered"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">
            Account Title / Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.accountTitle}
            onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
            placeholder="e.g. LUXORA ENTERPRISE"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">
            IBAN Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
            placeholder="PK36MEZN0001234567890101"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600 uppercase"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Account Number (Optional)</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="010123456789"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-bold text-gray-700 block mb-1">Branch Code / SWIFT (Optional)</label>
          <input
            type="text"
            value={formData.branchCode}
            onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
            placeholder="0101 / MEZNPKKA"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-bold text-gray-700 block mb-1">Customer Instructions (Optional)</label>
          <textarea
            rows={2}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Please transfer the exact amount and upload your payment receipt screenshot."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
      >
        {isSaving ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Saving to Database...</span>
          </>
        ) : (
          <>
            <Save size={15} />
            <span>Save Bank Details</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function AdminSettingsPage() {
  const [bankSaved, setBankSaved] = useState(false);

  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
  } = useQuery<BankSettingsResponse>({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchApi<BankSettingsResponse>("/api/admin/settings"),
  });

  const { data: auditLogs = [], isLoading: isLoadingAudit } = useQuery<AuditLog[]>({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => fetchApi<AuditLog[]>("/api/admin/audit-logs"),
  });

  const handleSuccess = () => {
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 4000);
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Bank transfer account details successfully updated and saved to database.</span>
        </div>
      )}

      {/* Store Bank Configuration Card */}
      {isLoadingSettings ? (
        <div className="bg-white border border-gray-200/70 p-12 rounded-3xl flex justify-center items-center text-purple-600 gap-2 shadow-2xs text-xs">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading store bank configuration...</span>
        </div>
      ) : isSettingsError || !settingsData?.settings ? (
        <div className="bg-white border border-gray-200/70 p-6 rounded-3xl shadow-2xs text-xs text-rose-700">
          Could not load bank configuration from database. Please reload the page.
        </div>
      ) : (
        <BankSettingsForm
          key={settingsData.settings.updatedAt || settingsData.settings.id}
          initialSettings={settingsData.settings}
          onSuccess={handleSuccess}
        />
      )}

      {/* Admin Audit Trail Card */}
      <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
        <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield size={18} className="text-purple-600" /> Admin Audit Logs
        </h3>

        {isLoadingAudit ? (
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
                  {log.details && (
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate max-w-md">
                      {log.details}
                    </p>
                  )}
                  <div className="text-[11px] text-gray-400 mt-0.5">By {log.user?.email || "Admin"}</div>
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


