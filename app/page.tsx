"use client";

import Link from "next/link";
import { useState } from "react";
import { Notice } from "@/components/ui";
import type { RoomType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { REFUND_POLICY, today, weightRange, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

/** 첫 화면: 날짜를 고르면 객실 종류별 빈 방 수 (로그인하지 않아도 볼 수 있다) */
export default function Home() {
  const { user } = useAuth();
  const [date, setDate] = useState(today());
  const { data, error, loading } = useFetch<{ date: string; roomTypes: RoomType[] }>(`/availability?date=${date}`);

  return (
    <>
      <h1>꼬리별 반려동물 호텔</h1>
      <p className="sub">몸무게에 맞는 방에서 편하게 쉬어요. 날짜를 고르면 그날 밤 남은 방을 보여 드려요.</p>

      <div className="panel">
        <label className="row wrap">
          <strong>날짜</strong>
          <input type="date" value={date} min={today()} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: "auto" }} />
        </label>
      </div>

      {error && <Notice>{error}</Notice>}
      {loading && !data ? (
        <p className="muted">빈 방을 확인하고 있어요…</p>
      ) : (
        <div className="grid">
          {data?.roomTypes.map((t) => (
            <div key={t.id} className="card">
              <div className="row between">
                <h2>{t.name}</h2>
                <span className={`badge ${t.available ? "green" : "red"}`}>{t.available ? `빈 방 ${t.available}개` : "만실"}</span>
              </div>
              <p className="muted small" style={{ margin: 0 }}>
                {weightRange(t)} · 전체 {t.total}개
              </p>
              <p style={{ margin: 0 }}>
                평일 <strong>{won(t.weekdayPrice)}</strong> · 주말(금·토 밤) <strong>{won(t.weekendPrice)}</strong>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>이용 안내</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>생후 5개월 이상, 종합백신·광견병 접종 1년 이내인 아이만 받아요.</li>
          <li>같은 보호자의 아이는 두 마리까지 한 방에 묵을 수 있어요. 방은 무거운 아이 몸무게로 정해요.</li>
          <li>취소 환불: {REFUND_POLICY}</li>
        </ul>
        <div style={{ marginTop: 14 }}>
          <Link href={user ? "/reservations/new" : "/login?next=/reservations/new"} className="btn primary">
            예약하기
          </Link>
        </div>
      </div>
    </>
  );
}
