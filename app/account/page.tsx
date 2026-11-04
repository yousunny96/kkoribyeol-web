"use client";

import { useState } from "react";
import { Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { Guard, useAuth } from "@/lib/auth";

function Account() {
  const { user } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err as ApiError);
    }
  }

  return (
    <div className="panel narrow">
      <h1>내 계정</h1>
      <p className="sub">
        {user!.name}님 · {user!.email}
      </p>
      <h2>비밀번호 바꾸기</h2>
      {error && <Notice>{error.message}</Notice>}
      {done && <Notice kind="ok">비밀번호를 바꿨어요.</Notice>}
      <form onSubmit={submit} noValidate>
        <Field label="지금 비밀번호" error={error?.errors.currentPassword}>
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="새 비밀번호" error={error?.errors.newPassword} hint="8자 이상">
          <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <button className="btn primary wide">바꾸기</button>
      </form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Guard>
      <Account />
    </Guard>
  );
}
