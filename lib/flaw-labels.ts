// Georgian labels for the flaw vocabulary. Mirrors the CHECK constraints in
// supabase/schemas/05a_condition_detail.sql — the database is the authority; this only
// names the values for display.
//
// Unknown codes fall back to the raw value rather than throwing: a vocabulary added to the
// database before this file is updated should degrade to something readable, not a blank.

export const FLAW_TYPE_LABELS: Record<string, string> = {
  scratch: "ნაკაწრი",
  dent: "ჩაჭყლეტა",
  stain: "ლაქა",
  chip: "ჩამოტეხილი",
  crack: "ბზარი",
  fade: "გახუნებული",
  wear: "ცვეთა",
  odour: "სუნი",
  missing_part: "ნაკლული დეტალი",
  repair: "შეკეთებული",
  other: "სხვა",
};

export const FLAW_SEVERITY_LABELS: Record<string, string> = {
  minor: "მცირე",
  moderate: "საშუალო",
  significant: "მნიშვნელოვანი",
};

// Severity drives colour as well as text. The palette stays within the storefront's
// existing greens and warm neutrals rather than a red/amber alarm scale: these are honest
// disclosures on an item worth buying, not warnings.
export const FLAW_SEVERITY_STYLES: Record<string, string> = {
  minor: "bg-[#e9eee9] text-[#3c5a49]",
  moderate: "bg-[#f3ead9] text-[#7a5312]",
  significant: "bg-[#f2e3e0] text-[#8c3a2e]",
};

export function flawTypeLabel(code: string) {
  return FLAW_TYPE_LABELS[code] ?? code;
}

export function flawSeverityLabel(code: string) {
  return FLAW_SEVERITY_LABELS[code] ?? code;
}

export function flawSeverityStyle(code: string) {
  return FLAW_SEVERITY_STYLES[code] ?? FLAW_SEVERITY_STYLES.minor;
}
