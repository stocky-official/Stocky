/**
 * Stocky Expiry Date Parser & Normalizer
 * Extracts and disambiguates expiration dates from raw OCR camera text.
 */

export interface ParsedDateResult {
  rawMatch: string;
  isoDate: string; // YYYY-MM-DD format for HTML5 <input type="date">
  displayDate: string; // e.g. "31 Oct 2026"
  confidence: number; // 0.0 - 1.0
  dateType: 'expiry' | 'generic';
  hasExplicitDay: boolean;
  year: number;
  month: number;
  day: number;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// Convert Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to standard ASCII digits (0-9)
function normalizeArabicDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
}

/**
 * Get the last day of a specific month in a given year.
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Normalize two-digit year into four-digit year (e.g. 26 -> 2026)
 */
function normalizeYear(rawYear: number): number {
  if (rawYear >= 100) return rawYear;
  return rawYear < 70 ? 2000 + rawYear : 1900 + rawYear;
}

/**
 * Check if the date values form a plausible expiration date
 * (between 2023 and 2045)
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 2023 || year > 2045) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = getLastDayOfMonth(year, month);
  if (day < 1 || day > maxDay) return false;
  return true;
}

/**
 * Format Year, Month, Day to standard ISO "YYYY-MM-DD"
 */
function formatIso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatDisplay(year: number, month: number, day: number): string {
  const monthName = MONTH_NAMES[month - 1] || String(month);
  return `${day} ${monthName} ${year}`;
}

/**
 * Primary Date Parser function
 * Analyzes OCR text and returns the most accurate expiration date candidate
 */
export function parseExpiryDateFromText(rawText: string): ParsedDateResult | null {
  if (!rawText || rawText.trim().length === 0) return null;

  // 1. Pre-process text: normalize arabic numerals, uppercase, normalize whitespace
  let text = normalizeArabicDigits(rawText);
  text = text.replace(/[\r\n]+/g, ' ');

  const candidates: ParsedDateResult[] = [];
  const hasExpKeyword = /\b(EXP|BB|BEST\s*BEFORE|USE\s*BY|EXPIRY|ED|VAL|BBD|E:)\b/i.test(text);

  // Helper to test and add candidate
  const testCandidate = (
    y: number,
    m: number,
    d: number,
    rawMatch: string,
    isExpiryContext: boolean,
    hasExplicitDay: boolean,
    baseConfidence: number
  ) => {
    const fullYear = normalizeYear(y);
    if (!isValidDate(fullYear, m, d)) return;

    let confidence = baseConfidence;
    if (isExpiryContext) confidence += 0.2;
    if (hasExplicitDay) confidence += 0.15;

    // Favor dates that are currently in the future (typical for inventory expiry)
    const now = new Date();
    const candidateDate = new Date(fullYear, m - 1, d);
    if (candidateDate > now) {
      confidence += 0.1;
    }

    candidates.push({
      rawMatch: rawMatch.trim(),
      isoDate: formatIso(fullYear, m, d),
      displayDate: formatDisplay(fullYear, m, d),
      confidence: Math.min(1.0, confidence),
      dateType: isExpiryContext ? 'expiry' : 'generic',
      hasExplicitDay,
      year: fullYear,
      month: m,
      day: d,
    });
  };

  // 1. Search ISO: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
  const isoRegex = /(?<![-/.0-9])(20[2-4]\d)[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])(?!\d)/g;
  let match: RegExpExecArray | null;
  while ((match = isoRegex.exec(text)) !== null) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx);
    testCandidate(y, m, d, match[0], isExp, true, 0.9);
  }

  // 2. Search DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const dmyFullRegex = /(?<![-/.0-9])(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20[2-4]\d)(?!\d)/g;
  while ((match = dmyFullRegex.exec(text)) !== null) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx);
    testCandidate(y, m, d, match[0], isExp, true, 0.9);
  }

  // 3. Search DD/MM/YY or DD.MM.YY (e.g. 15.10.26)
  const dmyShortRegex = /(?<![-/.0-9])(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](2[3-9]|3[0-9]|4[0-5])(?!\d)/g;
  while ((match = dmyShortRegex.exec(text)) !== null) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx);
    testCandidate(y, m, d, match[0], isExp, true, 0.85);
  }

  // 4. Search Named Months (e.g. 28-FEB-26, 15 OCT 2026, OCT 2026)
  const namedMonthRegex = /(?<![A-Z0-9])(?:(0?[1-9]|[12]\d|3[01])[-/\s]*)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[-/\s]*(20[2-4]\d|2[3-9]|3[0-9]|4[0-5])(?!\d)/gi;
  while ((match = namedMonthRegex.exec(text)) !== null) {
    const rawDay = match[1];
    const monthStr = match[2].toLowerCase().slice(0, 3);
    const m = MONTH_MAP[monthStr] || 1;
    const y = parseInt(match[3], 10);
    const fullYear = normalizeYear(y);
    const hasDay = Boolean(rawDay);
    const d = hasDay ? parseInt(rawDay, 10) : getLastDayOfMonth(fullYear, m);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx);
    testCandidate(fullYear, m, d, match[0], isExp, hasDay, 0.9);
  }

  // 5. Search MM/YYYY (prevent matching if preceded or followed by date separator or digit)
  const myFullRegex = /(?<![-/.0-9])(0?[1-9]|1[0-2])[-/.](20[2-4]\d)(?![-/.0-9])/g;
  while ((match = myFullRegex.exec(text)) !== null) {
    const m = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    const d = getLastDayOfMonth(y, m);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx);
    testCandidate(y, m, d, match[0], isExp, false, 0.75);
  }

  // 6. Search MM/YY (prevent matching if preceded or followed by date separator or digit)
  const myShortRegex = /(?<![-/.0-9])(0?[1-9]|1[0-2])[-/.](2[4-9]|3[0-9]|4[0-5])(?![-/.0-9])/g;
  while ((match = myShortRegex.exec(text)) !== null) {
    const m = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    const fullYear = normalizeYear(y);
    const d = getLastDayOfMonth(fullYear, m);
    const ctx = text.slice(Math.max(0, match.index - 12), match.index);
    const isExp = /(EXP|BB|USE|BEST|ED)/i.test(ctx) || hasExpKeyword;
    testCandidate(fullYear, m, d, match[0], isExp, false, 0.65);
  }

  if (candidates.length === 0) {
    return null;
  }

  // Disambiguation & Ranking
  candidates.sort((a, b) => {
    // 1. Explicit Expiration keyword takes priority over production
    if (a.dateType === 'expiry' && b.dateType !== 'expiry') return -1;
    if (b.dateType === 'expiry' && a.dateType !== 'expiry') return 1;

    // 2. If one candidate has an explicit day and covers the same year & month, it wins
    if (a.year === b.year && a.month === b.month) {
      if (a.hasExplicitDay && !b.hasExplicitDay) return -1;
      if (b.hasExplicitDay && !a.hasExplicitDay) return 1;
    }

    // 3. For multi-date labels (e.g. PROD 2024 and EXP 2026), the later date is the expiry date
    const timeA = new Date(a.isoDate).getTime();
    const timeB = new Date(b.isoDate).getTime();
    const diffMonths = (timeB - timeA) / (1000 * 60 * 60 * 24 * 30);

    // If dates differ by more than 2 months, pick the later date (expiry vs production)
    if (Math.abs(diffMonths) >= 2) {
      return timeB - timeA; // later date first
    }

    // 4. Higher confidence
    return b.confidence - a.confidence;
  });

  return candidates[0];
}
