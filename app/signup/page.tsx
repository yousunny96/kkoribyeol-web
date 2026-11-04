"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth, type SignupInput } from "@/lib/auth";

const EMPTY: SignupInput = { email: "", password: "", name: "", phone: "", emergencyName: "", emergencyPhone: "" };

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof SignupInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(form);
      router.replace("/pets?welcome=1");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const err = error?.errors ?? {};
  return (
    <div className="panel narrow">
      <h1>회원가입</h1>
      <p className="sub">보호자 정보를 등록해 주세요. 아이가 아플 때 연락드릴 비상 연락처도 함께 받아요.</p>
      {error && <Notice>{error.message}</Notice>}
      <form onSubmit={submit} noValidate>
        <Field label="이메일" error={err.email}>
          <input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="비밀번호" error={err.password} hint="8자 이상">
          <input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
        </Field>
        <div className="two">
          <Field label="이름" error={err.name}>
            <input autoComplete="name" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="연락처" error={err.phone}>
            <input type="tel" autoComplete="tel" placeholder="010-0000-0000" value={form.phone} onChange={set("phone")} />
          </Field>
        </div>
        <div className="two">
          <Field label="비상 연락처 이름" error={err.emergencyName} hint="예: 가족, 지인">
            <input value={form.emergencyName} onChange={set("emergencyName")} />
          </Field>
          <Field label="비상 연락처" error={err.emergencyPhone}>
            <input type="tel" placeholder="010-0000-0000" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
          </Field>
        </div>
        <button className="btn primary wide" disabled={busy}>
          {busy ? "가입하는 중…" : "가입하기"}
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 16 }}>
        이미 가입했나요? <Link href="/login" className="link">로그인</Link>
      </p>
    </div>
  );
}
