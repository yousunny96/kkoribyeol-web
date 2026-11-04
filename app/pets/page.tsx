"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, Notice } from "@/components/ui";
import { api, ApiError, type Pet } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { today } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

type Form = Record<"name" | "species" | "birthDate" | "weightKg" | "lastVaccineDate" | "lastRabiesDate" | "food" | "allergy", string>;
const EMPTY: Form = { name: "", species: "", birthDate: "", weightKg: "", lastVaccineDate: "", lastRabiesDate: "", food: "", allergy: "" };

const toForm = (p: Pet): Form => ({
  name: p.name,
  species: p.species,
  birthDate: p.birthDate,
  weightKg: String(p.weightKg),
  lastVaccineDate: p.lastVaccineDate ?? "",
  lastRabiesDate: p.lastRabiesDate ?? "",
  food: p.food ?? "",
  allergy: p.allergy ?? "",
});

/** 접종일 + 1년이 지났는지 */
function vaccineState(date: string | null) {
  if (!date) return { text: "기록 없음", kind: "red" };
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  const until = d.toISOString().slice(0, 10);
  return until < today() ? { text: `만료 (${until})`, kind: "red" } : { text: `${until}까지`, kind: "green" };
}

function PetForm({ pet, onDone, onCancel }: { pet?: Pet; onDone: () => void; onCancel?: () => void }) {
  const [form, setForm] = useState<Form>(pet ? toForm(pet) : EMPTY);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { ...form, weightKg: form.weightKg === "" ? "" : Number(form.weightKg) };
      await api(pet ? `/pets/${pet.id}` : "/pets", { method: pet ? "PATCH" : "POST", body });
      if (!pet) setForm(EMPTY);
      onDone();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const err = error?.errors ?? {};
  return (
    <form onSubmit={submit} noValidate>
      {error && <Notice>{error.message}</Notice>}
      <div className="two">
        <Field label="이름" error={err.name}>
          <input value={form.name} onChange={set("name")} />
        </Field>
        <Field label="종" error={err.species} hint="예: 말티즈, 코리안숏헤어">
          <input value={form.species} onChange={set("species")} />
        </Field>
        <Field label="생년월일" error={err.birthDate}>
          <input type="date" max={today()} value={form.birthDate} onChange={set("birthDate")} />
        </Field>
        <Field label="몸무게 (kg)" error={err.weightKg}>
          <input type="number" step="0.1" min="0.1" inputMode="decimal" value={form.weightKg} onChange={set("weightKg")} />
        </Field>
        <Field label="마지막 종합백신 접종일" error={err.lastVaccineDate}>
          <input type="date" max={today()} value={form.lastVaccineDate} onChange={set("lastVaccineDate")} />
        </Field>
        <Field label="마지막 광견병 접종일" error={err.lastRabiesDate}>
          <input type="date" max={today()} value={form.lastRabiesDate} onChange={set("lastRabiesDate")} />
        </Field>
        <Field label="사료" error={err.food}>
          <input value={form.food} onChange={set("food")} />
        </Field>
        <Field label="알레르기" error={err.allergy} hint="없으면 비워 두세요">
          <input value={form.allergy} onChange={set("allergy")} />
        </Field>
      </div>
      <div className="row">
        <button className="btn primary" disabled={busy}>
          {pet ? "저장" : "등록"}
        </button>
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}

function Pets() {
  const { data: pets, error, loading, reload } = useFetch<Pet[]>("/pets");
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).has("welcome"));
  }, []);
  useEffect(() => {
    if (pets && pets.length === 0) setAdding(true);
  }, [pets]);

  return (
    <>
      <div className="row between wrap">
        <div>
          <h1>내 반려동물</h1>
          <p className="sub">사료와 알레르기를 적어 두면 맡길 때마다 다시 묻지 않아요.</p>
        </div>
        {pets && pets.length > 0 && (
          <Link href="/reservations/new" className="btn primary">
            예약하기
          </Link>
        )}
      </div>
      {welcome && <Notice kind="ok">가입을 환영해요! 먼저 맡길 아이를 등록해 주세요.</Notice>}
      {error && <Notice>{error}</Notice>}
      {loading && !pets && <p className="muted">불러오는 중…</p>}

      <div className="grid">
        {pets?.map((p) =>
          editing === p.id ? (
            <div key={p.id} className="panel" style={{ gridColumn: "1 / -1" }}>
              <h2>{p.name} 정보 고치기</h2>
              <PetForm
                pet={p}
                onDone={() => {
                  setEditing(null);
                  reload();
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <div key={p.id} className="card">
              <div className="row between">
                <h2>{p.name}</h2>
                <button className="btn ghost sm" onClick={() => setEditing(p.id)}>
                  고치기
                </button>
              </div>
              <p className="muted small" style={{ margin: 0 }}>
                {p.species} · {p.weightKg}kg · {p.birthDate} 출생
              </p>
              <dl className="facts small">
                {[
                  ["종합백신", vaccineState(p.lastVaccineDate)],
                  ["광견병", vaccineState(p.lastRabiesDate)],
                ].map(([label, s]) => {
                  const v = s as { text: string; kind: string };
                  return (
                    <div key={label as string}>
                      <dt>{label as string}</dt>
                      <dd>
                        <span className={`badge ${v.kind}`}>{v.text}</span>
                      </dd>
                    </div>
                  );
                })}
                <div>
                  <dt>사료</dt>
                  <dd>{p.food || "-"}</dd>
                </div>
                <div>
                  <dt>알레르기</dt>
                  <dd>{p.allergy || "없음"}</dd>
                </div>
              </dl>
            </div>
          ),
        )}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        {adding ? (
          <>
            <h2>새로 등록하기</h2>
            <PetForm
              onDone={() => {
                setWelcome(false);
                reload();
              }}
              onCancel={pets?.length ? () => setAdding(false) : undefined}
            />
          </>
        ) : (
          <button className="btn ghost" onClick={() => setAdding(true)}>
            + 반려동물 등록
          </button>
        )}
      </div>
    </>
  );
}

export default function PetsPage() {
  return (
    <Guard>
      <Pets />
    </Guard>
  );
}
