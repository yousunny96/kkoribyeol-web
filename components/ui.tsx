import type { Status } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/format";

export function Notice({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: React.ReactNode }) {
  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </label>
  );
}

const STATUS_COLOR: Record<Status, string> = {
  booked: "blue",
  checked_in: "green",
  checked_out: "gray",
  cancelled: "red",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}
