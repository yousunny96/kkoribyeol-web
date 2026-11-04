"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Notice, StatusBadge } from "@/components/ui";
import { api, ApiError, type Reservation } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { dateTime, day, REFUND_POLICY, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error, reload } = useFetch<Reservation>(`/reservations/${id}`);
  const [created, setCreated] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).has("created"));
  }, []);

  async function cancel() {
    setCancelError("");
    try {
      await api(`/reservations/${id}/cancel`, { method: "POST" });
      setConfirming(false);
      setCreated(false);
      reload();
    } catch (err) {
      setCancelError((err as ApiError).message);
    }
  }

  if (error) return <Notice>{error}</Notice>;
  if (!r) return <p className="muted">불러오는 중…</p>;

  const c = r.charges;
  return (
    <>
      <Link href="/reservations" className="back">
        ← 내 예약
      </Link>
      {created && <Notice kind="ok">예약했어요! 체크인 날 만나요.</Notice>}
      <div className="row between wrap">
        <h1>예약 #{r.id}</h1>
        <StatusBadge status={r.status} />
      </div>

      <div className="panel">
        <dl className="facts">
          <div>
            <dt>기간</dt>
            <dd>
              {day(r.checkIn)} → {day(r.checkOut)} ({c.weekdayNights + c.weekendNights}박)
            </dd>
          </div>
          <div>
            <dt>객실</dt>
            <dd>
              {r.room.typeName} {r.room.roomNo}
            </dd>
          </div>
          <div>
            <dt>맡긴 아이</dt>
            <dd>{r.pets.map((p) => `${p.name} (${p.species}, ${p.weightKg}kg)`).join(", ")}</dd>
          </div>
          {r.checkedInAt && (
            <div>
              <dt>입실</dt>
              <dd>{dateTime(r.checkedInAt)}</dd>
            </div>
          )}
          {r.checkedOutAt && (
            <div>
              <dt>퇴실</dt>
              <dd>{dateTime(r.checkedOutAt)}</dd>
            </div>
          )}
          {r.cancelledOn && (
            <div>
              <dt>취소한 날</dt>
              <dd>{day(r.cancelledOn)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="panel">
        <h2>금액</h2>
        <div className="sum">
          {c.weekdayNights > 0 && (
            <div>
              <span>
                평일 {c.weekdayNights}박 × {won(c.weekdayRate)}
              </span>
              <span>{won(c.weekdayNights * c.weekdayRate)}</span>
            </div>
          )}
          {c.weekendNights > 0 && (
            <div>
              <span>
                주말(금·토 밤) {c.weekendNights}박 × {won(c.weekendRate)}
              </span>
              <span>{won(c.weekendNights * c.weekendRate)}</span>
            </div>
          )}
          {r.services.map((s) => (
            <div key={s.serviceId}>
              <span>
                {s.name} {s.quantity}회 × {won(s.unitPrice)}
              </span>
              <span>{won(s.amount)}</span>
            </div>
          ))}
          <div className="total">
            <span>합계</span>
            <span>{won(c.total)}</span>
          </div>
          {r.refund && (
            <div>
              <span>환불 ({percent(r.refund.rate)})</span>
              <strong>{won(r.refund.amount)}</strong>
            </div>
          )}
        </div>
      </div>

      {r.refundIfCancelledToday && (
        <div className="panel">
          <h2>예약 취소</h2>
          <p className="small muted" style={{ marginTop: 0 }}>
            {REFUND_POLICY}
          </p>
          {cancelError && <Notice>{cancelError}</Notice>}
          {confirming ? (
            <>
              <Notice kind="info">
                오늘 취소하면 {won(c.total)} 중 <strong>{won(r.refundIfCancelledToday.amount)}</strong>(
                {percent(r.refundIfCancelledToday.rate)})를 돌려받아요. 취소할까요?
              </Notice>
              <div className="row">
                <button className="btn danger" onClick={cancel}>
                  네, 취소할게요
                </button>
                <button className="btn ghost" onClick={() => setConfirming(false)}>
                  아니요
                </button>
              </div>
            </>
          ) : (
            <button className="btn ghost" onClick={() => setConfirming(true)}>
              취소하기 (환불 {won(r.refundIfCancelledToday.amount)})
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function ReservationDetailPage() {
  return (
    <Guard>
      <Detail />
    </Guard>
  );
}
