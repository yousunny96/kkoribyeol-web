"use client";

import Link from "next/link";
import { Notice, StatusBadge } from "@/components/ui";
import type { Reservation } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { day, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

function Reservations() {
  const { data, error, loading } = useFetch<Reservation[]>("/reservations");

  return (
    <>
      <div className="row between wrap">
        <div>
          <h1>내 예약</h1>
          <p className="sub">예약을 누르면 금액과 취소 환불을 볼 수 있어요.</p>
        </div>
        <Link href="/reservations/new" className="btn primary">
          예약하기
        </Link>
      </div>
      {error && <Notice>{error}</Notice>}
      {loading && !data && <p className="muted">불러오는 중…</p>}
      {data?.length === 0 && <div className="empty">아직 예약이 없어요.</div>}
      <div className="grid">
        {data?.map((r) => (
          <Link key={r.id} href={`/reservations/${r.id}`} className="card">
            <div className="row between">
              <strong>
                {day(r.checkIn)} → {day(r.checkOut)}
              </strong>
              <StatusBadge status={r.status} />
            </div>
            <span className="small muted">
              {r.room.typeName} {r.room.roomNo} · {r.charges.weekdayNights + r.charges.weekendNights}박
            </span>
            <span>{r.pets.map((p) => p.name).join(", ")}</span>
            <span className="row between">
              <span className="small muted">예약 #{r.id}</span>
              <strong>{won(r.charges.total)}</strong>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function ReservationsPage() {
  return (
    <Guard>
      <Reservations />
    </Guard>
  );
}
