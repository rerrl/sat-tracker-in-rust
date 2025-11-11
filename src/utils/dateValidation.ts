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
  // Check if all required fields are filled
  if (!startDate || !endDate || !totalSats || !totalUsd) {
    return false;
  }

  // Extract date part from ISO string if needed (YYYY-MM-DD from YYYY-MM-DDTHH:MM:SS.sssZ)
  const startDateOnly = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const endDateOnly = endDate.includes('T') ? endDate.split('T')[0] : endDate;

  // Validate start date format and values
  const startValidation = validateDateString(startDateOnly);
  if (!startValidation.isValid) {
    return false;
  }

  // Validate end date format and values
  const endValidation = validateDateString(endDateOnly);
  if (!endValidation.isValid) {
    return false;
  }

  // Check if start date is before end date
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return false;
  }

  // Validate total sats (must be positive integer)
  if (!/^\d+$/.test(totalSats) || parseInt(totalSats) <= 0) {
    return false;
  }

  // Validate total USD (must be positive number with up to 2 decimal places)
  if (!/^\d+(\.\d{1,2})?$/.test(totalUsd) || parseFloat(totalUsd) <= 0) {
    return false;
  }

  return true;
}
