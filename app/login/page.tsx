"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") ? next : "/reservations");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel narrow">
      <h1>로그인</h1>
      <p className="sub">예약하려면 로그인해 주세요.</p>
      {error && <Notice>{error.message}</Notice>}
      <form onSubmit={submit} noValidate>
        <Field label="이메일" error={error?.errors.email}>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="비밀번호" error={error?.errors.password}>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="btn primary wide" disabled={busy}>
          {busy ? "로그인하는 중…" : "로그인"}
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 16 }}>
        처음이신가요? <Link href="/signup" className="link">회원가입</Link>
      </p>
    </div>
  );
}
