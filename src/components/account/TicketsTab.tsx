"use client";

import { useState, useMemo } from "react";
import { toFa } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "pending" | "closed";
  createdAt: string;
  updatedAt: string;
  lastReply: string;
  messages: { from: "user" | "support"; text: string; at: string }[];
}

interface TicketsTabProps {
  tickets: Ticket[];
}

const PAGE_SIZE = 5;

export function TicketsTab({ tickets }: TicketsTabProps) {
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "closed">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selected = selectedId ? tickets.find((t) => t.id === selectedId) : null;

  if (selected) {
    return (
      <TicketDetail
        ticket={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (showNew) {
    return (
      <NewTicketForm
        onCancel={() => setShowNew(false)}
        onSubmit={() => setShowNew(false)}
      />
    );
  }

  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">تیکت‌ها</h2>
          <p className="panel-content-subtitle">
            {tickets.length === 0
              ? "پشتیبانی و ارتباط با تیم مدونات."
              : `${toFa(tickets.length)} تیکت · ${toFa(tickets.filter(t => t.status === "open").length)} باز`}
          </p>
        </div>
        <button
          type="button"
          className="btn-legal btn-legal-sm"
          onClick={() => setShowNew(true)}
        >
          + تیکت جدید
        </button>
      </div>

      <div className="panel-content-body">
        {tickets.length === 0 ? (
          <EmptyState
            title="تیکتی وجود ندارد"
            text="برای پرسیدن سؤال، گزارش مشکل یا درخواست قابلیت جدید، روی «تیکت جدید» بزنید. تیم ما ظرف ۵ روز کاری پاسخ می‌دهد."
          />
        ) : (
          <>
            <div className="panel-filters">
              <FilterPill label="همه" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} />
              <FilterPill label="باز" active={filter === "open"} onClick={() => { setFilter("open"); setPage(1); }} />
              <FilterPill label="در انتظار" active={filter === "pending"} onClick={() => { setFilter("pending"); setPage(1); }} />
              <FilterPill label="بسته" active={filter === "closed"} onClick={() => { setFilter("closed"); setPage(1); }} />
            </div>

            <div>
              {pageItems.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="panel-row"
                  style={{
                    width: "100%",
                    textAlign: "start",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div className="panel-row-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 7v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
                    </svg>
                  </div>
                  <div className="panel-row-main">
                    <div className="panel-row-title">
                      <span style={{ textDecoration: "none" }}>{t.subject}</span>
                    </div>
                    <div className="panel-row-meta">
                      <span>#{t.id}</span>
                      <span className="panel-row-meta-dot" />
                      <span>{t.category}</span>
                      <span className="panel-row-meta-dot" />
                      <span>به‌روزشده در {t.updatedAt}</span>
                      <span className="panel-row-meta-dot" />
                      <span className="truncate" style={{ maxWidth: 280 }}>{t.lastReply}</span>
                    </div>
                  </div>
                  <div className="panel-row-actions">
                    <span className={`panel-ticket-status panel-ticket-status-${t.status}`}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-5">
                <Pager
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  showSummary
                  unitLabel="تیکت"
                  totalItems={filtered.length}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function TicketDetail({
  ticket,
  onBack,
}: {
  ticket: Ticket;
  onBack: () => void;
}) {
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState(ticket.messages);

  const handleSend = () => {
    if (!reply.trim()) return;
    setMessages([...messages, { from: "user", text: reply.trim(), at: "اکنون" }]);
    setReply("");
  };

  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">{ticket.subject}</h2>
          <p className="panel-content-subtitle">
            #{ticket.id} · {ticket.category} · ایجاد در {ticket.createdAt}
          </p>
        </div>
        <button type="button" className="btn-legal btn-legal-ghost btn-legal-sm" onClick={onBack}>
          → بازگشت به فهرست
        </button>
      </div>

      <div className="panel-content-body">
        <div className="flex items-center gap-2 mb-4">
          <span className={`panel-ticket-status panel-ticket-status-${ticket.status}`}>
            {statusLabel(ticket.status)}
          </span>
        </div>

        {/* Message thread */}
        <div className="space-y-3 mb-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className="flex"
              style={{ justifyContent: m.from === "user" ? "flex-start" : "flex-end" }}
            >
              <div
                className="max-w-[80%] px-4 py-2.5 rounded"
                style={{
                  backgroundColor: m.from === "user" ? "var(--surface-sunken)" : "var(--charcoal)",
                  color: m.from === "user" ? "var(--ink)" : "#ffffff",
                  fontSize: "13.5px",
                  lineHeight: 1.7,
                }}
              >
                <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: 4 }}>
                  {m.from === "user" ? "شما" : "پشتیبانی مدونات"} · {m.at}
                </div>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        {ticket.status !== "closed" && (
          <div className="space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="پاسخ خود را بنویسید…"
              rows={3}
              className="auth-input"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <div className="flex justify-end">
              <button type="button" className="btn-legal btn-legal-sm" onClick={handleSend}>
                ارسال پاسخ
              </button>
            </div>
          </div>
        )}

        {ticket.status === "closed" && (
          <p className="text-[13px] text-[var(--ink-muted)] text-center py-3">
            این تیکت بسته شده است. برای ادامه، یک تیکت جدید باز کنید.
          </p>
        )}
      </div>
    </>
  );
}

function NewTicketForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("گزارش مشکل فنی");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!subject.trim() || !text.trim()) return;
    onSubmit();
  };

  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">تیکت جدید</h2>
          <p className="panel-content-subtitle">پشتیبانی ظرف ۵ روز کاری پاسخ می‌دهد.</p>
        </div>
        <button type="button" className="btn-legal btn-legal-ghost btn-legal-sm" onClick={onCancel}>
          → انصراف
        </button>
      </div>

      <div className="panel-content-body space-y-4">
        <div>
          <label className="auth-label" htmlFor="ticket-subject">موضوع</label>
          <input
            id="ticket-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="به‌اختصار موضوع تیکت را شرح دهید"
            className="auth-input"
          />
        </div>

        <div>
          <label className="auth-label" htmlFor="ticket-category">دسته‌بندی</label>
          <select
            id="ticket-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="auth-input"
            style={{ appearance: "none" }}
          >
            <option>گزارش مشکل فنی</option>
            <option>گزارش خطای محتوایی</option>
            <option>درخواست افزودن قانون</option>
            <option>پیشنهاد بهبود</option>
            <option>دسترسی‌پذیری</option>
            <option>سایر</option>
          </select>
        </div>

        <div>
          <label className="auth-label" htmlFor="ticket-text">متن تیکت</label>
          <textarea
            id="ticket-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="مشکل یا درخواست خود را به‌طور کامل شرح دهید. در صورت گزارش خطا، شناسه قانون و شماره ماده را ذکر کنید."
            rows={6}
            className="auth-input"
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-legal btn-legal-ghost btn-legal-sm" onClick={onCancel}>
            انصراف
          </button>
          <button
            type="button"
            className="btn-legal btn-legal-sm"
            onClick={handleSubmit}
            disabled={!subject.trim() || !text.trim()}
          >
            ارسال تیکت
          </button>
        </div>
      </div>
    </>
  );
}

/* ── helpers ── */
function statusLabel(s: string) {
  return s === "open" ? "باز" : s === "pending" ? "در انتظار پاسخ" : "بسته";
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel-filter-pill ${active ? "is-active" : ""}`}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel-empty">
      <div className="panel-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 7v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        </svg>
      </div>
      <p className="panel-empty-title">{title}</p>
      <p className="panel-empty-text">{text}</p>
    </div>
  );
}
