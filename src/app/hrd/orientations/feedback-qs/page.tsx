"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Check, X, Loader2, Trash2 } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  displayOrder: number;
}

export default function HRDFeedbackQsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function fetchQuestions() {
    const res = await fetch("/api/hrd/orientations/feedback-qs");
    if (res.ok) setQuestions(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchQuestions(); }, []);

  async function handleAdd() {
    if (!newText.trim()) return;
    setSaving(true);
    await fetch("/api/hrd/orientations/feedback-qs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText: newText.trim(), displayOrder: questions.length }),
    });
    setNewText("");
    setAdding(false);
    setSaving(false);
    fetchQuestions();
  }

  async function handleEdit(id: string) {
    if (!editText.trim()) return;
    await fetch(`/api/hrd/orientations/feedback-qs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText: editText }),
    });
    setEditingId(null);
    fetchQuestions();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/hrd/orientations/feedback-qs/${id}`, { method: "DELETE" });
    fetchQuestions();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          Feedback Questions
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Common questions for post-orientation feedback
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#180F04]/30" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-start gap-3 px-5 py-4 border-b border-black/5 last:border-0"
            >
              <span className="text-[#180F04]/30 text-sm font-['Geist'] mt-0.5 w-5 flex-shrink-0">
                {i + 1}.
              </span>
              {editingId === q.id ? (
                <div className="flex-1 flex items-start gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="flex-1 border border-[#D4A017] rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none resize-none"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(q.id)} className="text-[#180F04] hover:text-[#D4A017]">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-[#180F04]/30 hover:text-[#180F04]">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-start justify-between gap-3">
                  <p className="text-sm text-[#180F04] font-['Geist']">{q.questionText}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(q.id); setEditText(q.questionText); }}
                      className="text-[#180F04]/20 hover:text-[#180F04] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-[#180F04]/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && !adding && (
            <div className="px-6 py-8 text-center text-[#180F04]/40 text-sm font-['Geist']">
              No feedback questions yet.
            </div>
          )}

          {adding ? (
            <div className="px-5 py-4 border-t border-black/5 flex items-start gap-2">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={2}
                placeholder="New feedback question..."
                className="flex-1 border border-[#D4A017] rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none resize-none"
                autoFocus
              />
              <button onClick={handleAdd} disabled={saving} className="text-[#180F04] hover:text-[#D4A017]">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button onClick={() => { setAdding(false); setNewText(""); }} className="text-[#180F04]/30">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-black/5">
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 text-sm text-[#180F04]/50 hover:text-[#180F04] font-['Geist'] transition-colors"
              >
                <Plus size={14} />
                Add question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
