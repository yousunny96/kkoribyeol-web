import type { RoomType, Status } from "./api";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const STATUS_LABEL: Record<Status, string> = {
  booked: "예약됨",
  checked_in: "입실",
  checked_out: "퇴실",
  cancelled: "취소",
};

/** 2026-11-04 → 11월 4일 (수) */
export function day(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

/** 한국 날짜로 오늘 (YYYY-MM-DD) */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function addDays(d: string, n: number) {
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function weightRange(t: Pick<RoomType, "minWeight" | "maxWeight">) {
  return t.maxWeight === null ? `${t.minWeight}kg 이상` : t.minWeight === 0 ? `${t.maxWeight}kg 미만` : `${t.minWeight}~${t.maxWeight}kg 미만`;
}

export function fitsType(weight: number, t: Pick<RoomType, "minWeight" | "maxWeight">) {
  return weight >= t.minWeight && (t.maxWeight === null || weight < t.maxWeight);
}

/**
 * 신청 화면에서 보여 주는 예상 숙박비. 금·토요일 밤은 주말 요금.
 * 실제 금액은 백엔드가 같은 규칙으로 다시 계산한다
 */
export function estimateLodging(checkIn: string, checkOut: string, t: Pick<RoomType, "weekdayPrice" | "weekendPrice">) {
  let weekday = 0;
  let weekend = 0;
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    const w = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (w === 5 || w === 6) weekend++;
    else weekday++;
  }
  return { weekday, weekend, amount: weekday * t.weekdayPrice + weekend * t.weekendPrice };
}

/** 오늘 기준 몇 일 전 취소인지에 따른 환불 비율 안내 */
export const REFUND_POLICY = "체크인 3일 전까지 전액, 2일 전~전날 50%, 당일·노쇼 환불 없음";
