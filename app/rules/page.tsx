"use client";

import { useState } from "react";
import { Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

interface Source {
  document: string;
  position: number | null;
  score: number | null;
  content: string;
}
interface Answer {
  answer: string;
  conversationId: string | null;
  sources: Source[];
}
type Message = { role: "user"; text: string } | { role: "bot"; text: string; sources: Source[] };

const EXAMPLES = ["주말 요금은 언제 적용돼요?", "체크인 이틀 전에 취소하면 얼마 돌려받아요?", "생후 4개월 강아지도 맡길 수 있나요?", "아이가 아프면 어떻게 하나요?"];

/** 규정 묻기: 질문은 백엔드를 거쳐 Dify 챗봇으로 간다 (Dify 키는 서버에만 있음) */
export default function RulesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setQuestion("");
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const r = await api<Answer>("/rules/ask", { method: "POST", body: { question: text, conversationId } });
      setConversationId(r.conversationId);
      setMessages((m) => [...m, { role: "bot", text: r.answer, sources: r.sources }]);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>규정 묻기</h1>
      <p className="sub">예약·취소 규정, 입실 조건, 응급 대응 안내에 적힌 내용으로 답해요. 문서에 없는 내용은 모른다고 답해요.</p>

      {messages.length === 0 && (
        <div className="row wrap" style={{ marginBottom: 16 }}>
          {EXAMPLES.map((e) => (
            <button key={e} className="btn ghost sm" onClick={() => ask(e)} disabled={busy}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="chat-q">
              {m.text}
            </div>
          ) : (
            <div key={i} className="panel" style={{ margin: 0 }}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              {m.sources.length > 0 && (
                <details style={{ marginTop: 12 }}>
                  <summary className="small muted" style={{ cursor: "pointer" }}>
                    근거 문서 {m.sources.length}개
                  </summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {m.sources.map((s, j) => (
                      <div key={j} className="chat-src">
                        <div className="row between small">
                          <strong>{s.document}</strong>
                          {s.score !== null && <span className="muted">점수 {s.score}</span>}
                        </div>
                        <div className="small muted" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                          {s.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ),
        )}
        {busy && <p className="muted small">답을 찾고 있어요…</p>}
      </div>

      {error && <Notice>{error}</Notice>}

      <form
        className="row"
        style={{ marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="궁금한 규정을 물어보세요" maxLength={500} />
        <button className="btn primary" disabled={busy || !question.trim()}>
          묻기
        </button>
      </form>
    </>
  );
}
