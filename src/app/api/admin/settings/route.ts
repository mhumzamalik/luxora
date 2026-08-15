import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBankSettings, updateBankSettings } from "@/lib/bank-settings";
import { logAdminAction } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await getBankSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { bankName, accountTitle, iban, accountNumber, branchCode, instructions } = body;

    if (!bankName || typeof bankName !== "string" || !bankName.trim()) {
      return NextResponse.json({ error: "Bank name is required." }, { status: 400 });
    }

    if (!accountTitle || typeof accountTitle !== "string" || !accountTitle.trim()) {
      return NextResponse.json({ error: "Account title is required." }, { status: 400 });
    }

    if (!iban || typeof iban !== "string" || !iban.trim()) {
      return NextResponse.json({ error: "IBAN or account number is required." }, { status: 400 });
    }

    const updated = await updateBankSettings({
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      iban: iban.trim().toUpperCase(),
      accountNumber: accountNumber ? String(accountNumber).trim() : null,
      branchCode: branchCode ? String(branchCode).trim() : null,
      instructions: instructions ? String(instructions).trim() : null,
    });

    if (session.user?.id) {
      await logAdminAction({
        userId: session.user.id,
        action: "UPDATE_BANK_SETTINGS",
        entity: "BankSetting",
        entityId: "default",
        details: {
          bankName: updated.bankName,
          accountTitle: updated.accountTitle,
          iban: updated.iban,
          accountNumber: updated.accountNumber,
          branchCode: updated.branchCode,
        },
      });
    }

    // Invalidate cached checkout and public bank details routes
    revalidatePath("/checkout");
    revalidatePath("/api/bank-details");
    revalidatePath("/admin/settings");

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update bank settings" },
      { status: 500 }
    );
  }
}
