export interface DateValidationResult {
  isValid: boolean;
  year: number | null;
  month: number | null;
  day: number | null;
}

export function validateDateString(dateString: string): DateValidationResult {
  const parts = dateString.split("-");
  
  if (parts.length !== 3) {
    return { isValid: false, year: null, month: null, day: null };
  }

  const [yearStr, monthStr, dayStr] = parts;
  
  // Check if all parts have the correct length
  if (yearStr.length !== 4 || monthStr.length !== 2 || dayStr.length !== 2) {
    return { isValid: false, year: null, month: null, day: null };
  }

  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);

  // Validate year range (2009 to next year)
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  const yearValid = year >= 2009 && year <= nextYear;
  const monthValid = month >= 1 && month <= 12;
  const dayValid = day >= 1 && day <= 31;

  return {
    isValid: yearValid && monthValid && dayValid,
    year: yearValid ? year : null,
    month: monthValid ? month : null,
    day: dayValid ? day : null,
  };
}

export function validateLumpsumForm(
  startDate: string,
  endDate: string,
  totalSats: string,
  totalUsd: string
): boolean {
  const startValid = validateDateString(startDate).isValid;
  const endValid = validateDateString(endDate).isValid;
  
  const satsValid = Boolean(totalSats && /^\d+$/.test(totalSats) && parseInt(totalSats) > 0);
  const usdValid = Boolean(totalUsd && /^\d+(\.\d{1,2})?$/.test(totalUsd) && parseFloat(totalUsd) > 0);

  return startValid && endValid && satsValid && usdValid;
}
