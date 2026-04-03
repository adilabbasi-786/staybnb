const MS_PER_DAY = 86_400_000;

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseLocalDate(checkIn).getTime();
  const end = parseLocalDate(checkOut).getTime();
  return Math.round((end - start) / MS_PER_DAY);
}

export function validateBookingDates(
  checkIn: string,
  checkOut: string,
): { ok: true } | { ok: false; error: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Invalid dates." };
  }
  if (end <= start) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  if (start < today) {
    return { ok: false, error: "Check-in cannot be in the past." };
  }
  return { ok: true };
}
