/** 시간대 표기가 없는 "2027-03-31 23:59:00" 형식은 한국 시간으로 본다 */
const LOCAL_DATETIME = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(s: string | null | undefined): number | undefined {
  if (!s) return undefined;
  const v = s.trim();
  const local = LOCAL_DATETIME.exec(v);
  const iso = local ? `${local[1]}T${local[2]}+09:00` : DATE_ONLY.test(v) ? `${v}T23:59:59+09:00` : v;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

/** 여러 기한 중 가장 이른 날짜를 ISO 문자열로 돌려준다 */
export function earliestDate(...dates: (string | null | undefined)[]): string | undefined {
  const ts = dates.map(parseDate).filter((t): t is number => t != null);
  return ts.length ? new Date(Math.min(...ts)).toISOString() : undefined;
}

export const isExpired = (r: { expiresAt?: string }, now = Date.now()) => {
  const t = parseDate(r.expiresAt);
  return t != null && t < now;
};

/** 화면 표시용: 2027-03-31 23:59:00 → 2027.03.31 (한국 시간 기준) */
export function fmtDate(s?: string) {
  const t = parseDate(s);
  if (t == null) return '';
  const d = new Date(t + 9 * 3600_000).toISOString();
  return `${d.slice(0, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}`;
}

/** 화면 표시용 시각: 2026.11.08 04:47:06 (한국 시간, 24시간제) */
export function fmtDateTime(ms: number) {
  const d = new Date(ms + 9 * 3600_000).toISOString();
  return `${d.slice(0, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)} ${d.slice(11, 19)}`;
}

/** 만료가 이 일수 안으로 남으면 D-n으로 강조한다 */
export const EXPIRY_SOON_DAYS = 14;

const DAY = 86_400_000;
/** 한국 시간 기준 날짜 번호 (일 단위) */
const kstDay = (ms: number) => Math.floor((ms + 9 * 3600_000) / DAY);

/**
 * 목록 표시용 만료일. 남은 날짜와 상관없이 `D-5`(당일은 `D-day`)로 짧게 적는다.
 * 날짜를 다 적으면 좁은 행에서 잘려 보이지 않기 때문이다.
 * 14일 안으로 남으면 soon=true. 만료일이 없으면 빈 문자열.
 */
export function fmtExpiry(s?: string, now = Date.now()): { text: string; soon: boolean } {
  const t = parseDate(s);
  if (t == null) return { text: '', soon: false };
  const days = kstDay(t) - kstDay(now);
  return { text: days <= 0 ? 'D-day' : `D-${days}`, soon: days <= EXPIRY_SOON_DAYS };
}
