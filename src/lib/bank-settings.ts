import { prisma } from "@/lib/prisma";

export interface BankSettingsData {
  id?: string;
  bankName: string;
  accountTitle: string;
  accountNumber?: string | null;
  iban: string;
  branchCode?: string | null;
  instructions?: string | null;
  updatedAt?: Date;
}

export const DEFAULT_BANK_SETTINGS: BankSettingsData = {
  id: "default",
  bankName: "Meezan Bank Ltd",
  accountTitle: "LUXORA ENTERPRISE",
  accountNumber: "010123456789",
  iban: "PK36MEZN0001234567890101",
  branchCode: "0101",
  instructions: "Please transfer the exact order amount and upload your transaction receipt.",
};

/**
 * Fetch the store bank settings from the database.
 * If no record exists, seeds the default record.
 */
export async function getBankSettings(): Promise<BankSettingsData> {
  try {
    let settings = await prisma.bankSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.bankSetting.create({
        data: {
          id: "default",
          bankName: DEFAULT_BANK_SETTINGS.bankName,
          accountTitle: DEFAULT_BANK_SETTINGS.accountTitle,
          accountNumber: DEFAULT_BANK_SETTINGS.accountNumber,
          iban: DEFAULT_BANK_SETTINGS.iban,
          branchCode: DEFAULT_BANK_SETTINGS.branchCode,
          instructions: DEFAULT_BANK_SETTINGS.instructions,
        },
      });
    }

    return {
      id: settings.id,
      bankName: settings.bankName,
      accountTitle: settings.accountTitle,
      accountNumber: settings.accountNumber,
      iban: settings.iban,
      branchCode: settings.branchCode,
      instructions: settings.instructions,
      updatedAt: settings.updatedAt,
    };
  } catch (error) {
    console.error("Failed to fetch bank settings from database:", error);
    return DEFAULT_BANK_SETTINGS;
  }
}

/**
 * Update or insert the store bank settings in the database.
 */
export async function updateBankSettings(
  data: Partial<Omit<BankSettingsData, "id" | "updatedAt">>
): Promise<BankSettingsData> {
  const bankName = (data.bankName || DEFAULT_BANK_SETTINGS.bankName).trim();
  const accountTitle = (data.accountTitle || DEFAULT_BANK_SETTINGS.accountTitle).trim();
  const iban = (data.iban || DEFAULT_BANK_SETTINGS.iban).trim().toUpperCase();
  const accountNumber = data.accountNumber ? data.accountNumber.trim() : null;
  const branchCode = data.branchCode ? data.branchCode.trim() : null;
  const instructions = data.instructions ? data.instructions.trim() : null;

  const settings = await prisma.bankSetting.upsert({
    where: { id: "default" },
    update: {
      bankName,
      accountTitle,
      iban,
      accountNumber,
      branchCode,
      instructions,
    },
    create: {
      id: "default",
      bankName,
      accountTitle,
      iban,
      accountNumber,
      branchCode,
      instructions,
    },
  });

  return {
    id: settings.id,
    bankName: settings.bankName,
    accountTitle: settings.accountTitle,
    accountNumber: settings.accountNumber,
    iban: settings.iban,
    branchCode: settings.branchCode,
    instructions: settings.instructions,
    updatedAt: settings.updatedAt,
  };
}
