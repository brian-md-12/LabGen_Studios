// Access Code Definitions
export interface AccessCode {
  code: string;
  maxUses: number; // Number of times this code can be successfully used (validated locally)
  type: 'admin' | 'standard' | 'limited';
}

export const ACCESS_CODES: AccessCode[] = [
  { code: "LABGEN-BETA-2025", maxUses: 1000, type: 'standard' },
  { code: "SCIENCE-VIP", maxUses: 100, type: 'admin' },
  { code: "KEVIN-BRIAN-ADMIN", maxUses: 9999, type: 'admin' },
  { code: "TEST-KEY-123", maxUses: 5, type: 'limited' }
];

const STORAGE_KEYS = {
  CODE_USAGE: 'labgen_code_usage_v1'
};

export const validateAccessCode = (inputCode: string): { valid: boolean; message?: string } => {
  const normalizedInput = inputCode.trim().toUpperCase();
  const codeDef = ACCESS_CODES.find(c => c.code === normalizedInput);

  if (!codeDef) {
    return { valid: false, message: "Invalid access code." };
  }

  // Check usage limits
  try {
    const usageData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CODE_USAGE) || '{}');
    const currentUsage = usageData[normalizedInput] || 0;

    if (currentUsage >= codeDef.maxUses) {
      return { valid: false, message: "This access code has reached its usage limit on this device." };
    }
  } catch (e) {
    console.error("Error checking code usage", e);
  }

  return { valid: true };
};

export const incrementCodeUsage = (inputCode: string) => {
  const normalizedInput = inputCode.trim().toUpperCase();
  try {
    const usageData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CODE_USAGE) || '{}');
    usageData[normalizedInput] = (usageData[normalizedInput] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.CODE_USAGE, JSON.stringify(usageData));
  } catch (e) {
    console.error("Error updating code usage", e);
  }
};
