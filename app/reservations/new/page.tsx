"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Field, Notice } from "@/components/ui";
import { api, ApiError, type Pet, type Reservation, type RoomType, type Service } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { addDays, estimateLodging, fitsType, REFUND_POLICY, today, weightRange, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

function NewReservation() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));
  const [petIds, setPetIds] = useState<number[]>([]);
  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const pets = useFetch<Pet[]>("/pets");
  const services = useFetch<Service[]>("/services");
  const availability = useFetch<{ roomTypes: RoomType[] }>(`/availability?date=${checkIn}`);
  const types = availability.data?.roomTypes ?? [];

  const selected = (pets.data ?? []).filter((p) => petIds.includes(p.id));
  const heaviest = selected.length ? Math.max(...selected.map((p) => p.weightKg)) : null;

  // 아이를 고르면 몸무게에 맞는 객실 종류를 미리 골라 둔다 (다른 종류로 바꿀 수는 있지만 맞지 않으면 백엔드가 거절한다)
  useEffect(() => {
    if (heaviest === null) return;
    const fit = types.find((t) => fitsType(heaviest, t));
    if (fit) setRoomTypeId(fit.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heaviest, types.length]);

  const type = types.find((t) => t.id === roomTypeId);
  const lodging = type && checkOut > checkIn ? estimateLodging(checkIn, checkOut, type) : null;
  const serviceLines = useMemo(
    () => (services.data ?? []).filter((s) => (quantities[s.id] ?? 0) > 0).map((s) => ({ ...s, quantity: quantities[s.id] })),
    [services.data, quantities],
  );
  const serviceAmount = serviceLines.reduce((sum, s) => sum + s.price * s.quantity, 0);

  function togglePet(id: number) {
    setPetIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 2 ? ids : [...ids, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<Reservation>("/reservations", {
        method: "POST",
        body: {
          roomTypeId,
          checkIn,
          checkOut,
          petIds,
          services: serviceLines.map((s) => ({ serviceId: s.id, quantity: s.quantity })),
        },
      });
      router.push(`/reservations/${r.id}?created=1`);
    } catch (err) {
      setError(err as ApiError);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  if (pets.data && pets.data.length === 0) {
    return (
      <div className="empty">
        <p>먼저 맡길 반려동물을 등록해 주세요.</p>
        <Link href="/pets" className="btn primary">
          반려동물 등록하기
        </Link>
      </div>
    );
  }

  const err = error?.errors ?? {};
  return (
    <form onSubmit={submit} noValidate>
      <Link href="/reservations" className="back">
        ← 내 예약
      </Link>
      <h1>예약하기</h1>
      <p className="sub">한 예약에 같은 보호자의 아이를 두 마리까지 함께 맡길 수 있어요.</p>
      {error && (
        <Notice>
          <strong>예약할 수 없어요.</strong> {error.message}
        </Notice>
      )}

      <div className="panel">
        <h2>1. 날짜</h2>
        <div className="two">
          <Field label="체크인" error={err.checkIn}>
            <input
              type="date"
              min={today()}
              value={checkIn}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                setCheckIn(v);
                if (checkOut <= v) setCheckOut(addDays(v, 1));
              }}
            />
          </Field>
          <Field label="체크아웃" error={err.checkOut}>
            <input type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(e) => e.target.value && setCheckOut(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="panel">
        <h2>2. 맡길 아이 (최대 2마리)</h2>
        {err.petIds && <p className="small" style={{ color: "var(--danger)" }}>{err.petIds}</p>}
        <div className="grid">
          {pets.data?.map((p) => {
            const on = petIds.includes(p.id);
            return (
              <label key={p.id} className={`card pick ${on ? "on" : ""} ${!on && petIds.length >= 2 ? "off" : ""}`}>
                <div className="row">
                  <input type="checkbox" checked={on} onChange={() => togglePet(p.id)} disabled={!on && petIds.length >= 2} />
                  <strong>{p.name}</strong>
                  <span className="muted small">
                    {p.species} · {p.weightKg}kg
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>3. 객실 종류</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          {heaviest === null ? "아이를 고르면 몸무게에 맞는 방을 골라 드려요." : `무거운 아이 ${heaviest}kg 기준으로 맞는 방을 골라 두었어요.`}{" "}
          빈 방 수는 체크인 날 밤 기준이에요.
        </p>
        <div className="grid">
          {types.map((t) => {
            const fits = heaviest !== null && fitsType(heaviest, t);
            return (
              <label key={t.id} className={`card pick ${roomTypeId === t.id ? "on" : ""}`}>
                <div className="row between">
                  <div className="row">
                    <input type="radio" name="roomType" checked={roomTypeId === t.id} onChange={() => setRoomTypeId(t.id)} />
                    <strong>{t.name}</strong>
                  </div>
                  {fits && <span className="badge green">몸무게 맞음</span>}
                </div>
                <span className="small muted">
                  {weightRange(t)} · 빈 방 {t.available}/{t.total}
                </span>
                <span className="small">
                  평일 {won(t.weekdayPrice)} · 주말 {won(t.weekendPrice)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>4. 추가 서비스</h2>
        {services.data?.map((s) => (
          <div key={s.id} className="row between" style={{ padding: "6px 0" }}>
            <span>
              {s.name} <span className="muted small">{won(s.price)} / 회</span>
            </span>
            <div className="stepper">
              <button type="button" className="btn ghost sm" onClick={() => setQuantities({ ...quantities, [s.id]: Math.max(0, (quantities[s.id] ?? 0) - 1) })}>
                −
              </button>
              <input readOnly value={quantities[s.id] ?? 0} aria-label={`${s.name} 횟수`} />
              <button type="button" className="btn ghost sm" onClick={() => setQuantities({ ...quantities, [s.id]: Math.min(30, (quantities[s.id] ?? 0) + 1) })}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>예상 금액</h2>
        {lodging && type ? (
          <div className="sum">
            <div>
              <span>
                {type.name} 평일 {lodging.weekday}박 × {won(type.weekdayPrice)}
                {lodging.weekend > 0 && ` + 주말 ${lodging.weekend}박 × ${won(type.weekendPrice)}`}
              </span>
              <span>{won(lodging.amount)}</span>
            </div>
            {serviceLines.map((s) => (
              <div key={s.id}>
                <span>
                  {s.name} {s.quantity}회
                </span>
                <span>{won(s.price * s.quantity)}</span>
              </div>
            ))}
            <div className="total">
              <span>합계</span>
              <span>{won(lodging.amount + serviceAmount)}</span>
            </div>
          </div>
        ) : (
          <p className="muted">날짜와 객실 종류를 고르면 금액을 보여 드려요.</p>
        )}
        <p className="small muted">취소 환불: {REFUND_POLICY}</p>
        <button className="btn primary wide" disabled={busy || !petIds.length || !roomTypeId}>
          {busy ? "예약하는 중…" : "예약하기"}
        </button>
      </div>
    </form>
  );
}

export default function NewReservationPage() {
  return (
    <Guard>
      <NewReservation />
    </Guard>
  );
}
