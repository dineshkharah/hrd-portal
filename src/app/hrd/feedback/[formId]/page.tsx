"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const QUESTION_TYPES = ["star_rating", "multiple_choice", "yes_no", "short_text", "long_text"];
const COLORS = ["#D4A017", "#180F04", "#6b7280", "#d1d5db", "#f3f4f6"];

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
  displayOrder: number;
};

type Form = {
  id: string;
  eventName: string;
  eventDate: string;
  isActive: boolean;
  allowResubmit: boolean;
  feedbackOpenAt: string | null;
  feedbackCloseAt: string | null;
  questions: Question[];
  _count: { submissions: number };
};

type Submission = {
  id: string;
  submittedAt: string;
  submitter: { name: string; role: string };
  responses: { questionId: string; answer: string; question: Question }[];
};

export default function HrdFeedbackFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<"overview" | "questions" | "responses" | "analytics">("questions");
  const [newQ, setNewQ] = useState({ questionText: "", questionType: "star_rating", options: "", isRequired: true });
  const [saving, setSaving] = useState(false);

  async function loadForm() {
    const [f, s] = await Promise.all([
      fetch(`/api/feedback/forms/${formId}`).then((r) => r.json()),
      fetch(`/api/feedback/forms/${formId}/responses`).then((r) => r.json()),
    ]);
    setForm(f);
    setSubmissions(Array.isArray(s) ? s : []);
  }

  useEffect(() => { loadForm(); }, [formId]);

  async function toggleActive() {
    if (!form) return;
    await fetch(`/api/feedback/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !form.isActive }),
    });
    loadForm();
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const opts = newQ.questionType === "multiple_choice" && newQ.options
      ? newQ.options.split("\n").map((o) => o.trim()).filter(Boolean)
      : null;
    await fetch(`/api/feedback/forms/${formId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: newQ.questionText,
        questionType: newQ.questionType,
        options: opts,
        isRequired: newQ.isRequired,
        displayOrder: form ? form.questions.length : 0,
      }),
    });
    setSaving(false);
    setNewQ({ questionText: "", questionType: "star_rating", options: "", isRequired: true });
    loadForm();
  }

  async function deleteQuestion(qid: string) {
    await fetch(`/api/feedback/forms/${formId}/questions/${qid}`, { method: "DELETE" });
    loadForm();
  }

  // Analytics helpers
  function getStarData(questionId: string) {
    const tally: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    submissions.forEach((s) => {
      const r = s.responses.find((r) => r.questionId === questionId);
      if (r) tally[Number(r.answer)] = (tally[Number(r.answer)] || 0) + 1;
    });
    return [1, 2, 3, 4, 5].map((n) => ({ name: `${n}★`, count: tally[n] }));
  }

  function getPieData(questionId: string) {
    const tally: Record<string, number> = {};
    submissions.forEach((s) => {
      const r = s.responses.find((r) => r.questionId === questionId);
      if (r) tally[r.answer] = (tally[r.answer] || 0) + 1;
    });
    return Object.entries(tally).map(([name, value]) => ({ name, value }));
  }

  if (!form) return <div className="p-8 text-center text-[#180F04]/40 text-sm">Loading…</div>;

  const TABS = ["overview", "questions", "responses", "analytics"] as const;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Link href="/hrd/feedback" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] mb-4 transition-colors">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">{form.eventName}</h1>
          <p className="text-sm text-[#180F04]/50 mt-0.5">
            {new Date(form.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
            {form._count.submissions} submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/export/feedback/${formId}?format=csv`} className="text-xs border border-black/15 text-[#180F04] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors flex items-center gap-1.5">
            <Download size={12} /> CSV
          </a>
          <a href={`/api/export/feedback/${formId}?format=xlsx`} className="text-xs bg-[#D4A017] text-[#180F04] px-3 py-1.5 rounded-lg hover:bg-[#b8860b] transition-colors font-semibold flex items-center gap-1.5">
            <Download size={12} /> Excel
          </a>
          <button
            onClick={toggleActive}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${form.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
          >
            {form.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/10 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? "border-b-2 border-[#D4A017] text-[#180F04]" : "text-[#180F04]/40 hover:text-[#180F04]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Submissions", value: form._count.submissions },
              { label: "Questions", value: form.questions.length },
              { label: "Status", value: form.isActive ? "Active" : "Inactive" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-black/5 p-4">
                <p className="text-xs text-[#180F04]/50">{label}</p>
                <p className="text-xl font-bold text-[#180F04] mt-1">{value}</p>
              </div>
            ))}
          </div>
          {form.feedbackOpenAt && (
            <p className="text-sm text-[#180F04]/60">Opens: {new Date(form.feedbackOpenAt).toLocaleString("en-IN")}</p>
          )}
          {form.feedbackCloseAt && (
            <p className="text-sm text-[#180F04]/60">Closes: {new Date(form.feedbackCloseAt).toLocaleString("en-IN")}</p>
          )}
        </div>
      )}

      {/* Questions tab */}
      {tab === "questions" && (
        <div className="space-y-4">
          {form.questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-black/5 p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#180F04]">{i + 1}. {q.questionText}</p>
                <p className="text-xs text-[#180F04]/40 mt-0.5 capitalize">{q.questionType.replace("_", " ")} {q.isRequired ? "· required" : "· optional"}</p>
                {q.options && q.options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {q.options.map((o) => <span key={o} className="text-xs bg-[#FBF7EE] text-[#180F04]/70 px-2 py-0.5 rounded">{o}</span>)}
                  </div>
                )}
              </div>
              <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {/* Add question form */}
          <form onSubmit={addQuestion} className="bg-white rounded-xl border border-dashed border-black/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-[#180F04]">Add Question</p>
            <input
              value={newQ.questionText}
              onChange={(e) => setNewQ((q) => ({ ...q, questionText: e.target.value }))}
              required
              placeholder="Question text"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
            />
            <select
              value={newQ.questionType}
              onChange={(e) => setNewQ((q) => ({ ...q, questionType: e.target.value }))}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
            >
              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            {newQ.questionType === "multiple_choice" && (
              <textarea
                value={newQ.options}
                onChange={(e) => setNewQ((q) => ({ ...q, options: e.target.value }))}
                rows={3}
                placeholder="One option per line"
                className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017] resize-none"
              />
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#180F04] cursor-pointer">
                <input type="checkbox" checked={newQ.isRequired} onChange={(e) => setNewQ((q) => ({ ...q, isRequired: e.target.checked }))} className="accent-[#D4A017]" />
                Required
              </label>
              <button type="submit" disabled={saving} className="bg-[#D4A017] text-[#180F04] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <Plus size={14} /> Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Responses tab */}
      {tab === "responses" && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">No submissions yet</div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold text-[#180F04]">{sub.submitter.name} · {sub.submitter.role}</p>
                <p className="text-[10px] text-[#180F04]/40 mb-3">{new Date(sub.submittedAt).toLocaleString("en-IN")}</p>
                <div className="space-y-1.5">
                  {sub.responses.map((r) => (
                    <div key={r.questionId} className="flex gap-2">
                      <span className="text-xs text-[#180F04]/50 flex-1 min-w-0">{r.question.questionText}:</span>
                      <span className="text-xs font-medium text-[#180F04]">{r.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {form.questions.filter((q) => ["star_rating", "yes_no", "multiple_choice"].includes(q.questionType)).map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-black/5 p-5">
              <p className="text-sm font-semibold text-[#180F04] mb-4">{q.questionText}</p>
              {q.questionType === "star_rating" && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={getStarData(q.id)}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#D4A017" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {(q.questionType === "yes_no" || q.questionType === "multiple_choice") && (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={getPieData(q.id)} dataKey="value" nameKey="name" outerRadius={70} label={false} labelLine={false}>
                        {getPieData(q.id).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {getPieData(q.id).map(({ name, value }, i) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-[#180F04]">{name}: <strong>{value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {form.questions.filter((q) => ["star_rating", "yes_no", "multiple_choice"].includes(q.questionType)).length === 0 && (
            <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">
              No quantifiable questions to chart
            </div>
          )}
        </div>
      )}
    </div>
  );
}
