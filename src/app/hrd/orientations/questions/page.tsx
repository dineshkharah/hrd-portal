"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Check, X, Loader2, Trash2 } from "lucide-react";

type OrientationType = "core_member" | "bod" | "everyone";

interface Question {
  id: string;
  orientationType: OrientationType;
  questionText: string;
  displayOrder: number;
  isActive: boolean;
}

const TYPE_TABS: { value: OrientationType; label: string }[] = [
  { value: "core_member", label: "Core Member" },
  { value: "bod", label: "BOD" },
  { value: "everyone", label: "Everyone" },
];

export default function HRDQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<OrientationType>("core_member");
  const [newText, setNewText] = useState("");
  const [addingFor, setAddingFor] = useState<OrientationType | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function fetchQuestions() {
    const res = await fetch("/api/hrd/orientations/questions");
    if (res.ok) setQuestions(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchQuestions(); }, []);

  async function handleAdd() {
    if (!newText.trim()) return;
    setSaving(true);
    const existing = questions.filter((q) => q.orientationType === addingFor!);
    await fetch("/api/hrd/orientations/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orientationType: addingFor,
        questionText: newText.trim(),
        displayOrder: existing.length,
      }),
    });
    setNewText("");
    setAddingFor(null);
    setSaving(false);
    fetchQuestions();
  }

  async function handleEdit(id: string) {
    if (!editText.trim()) return;
    await fetch(`/api/hrd/orientations/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText: editText }),
    });
    setEditingId(null);
    fetchQuestions();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/hrd/orientations/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  }

  const filtered = questions.filter((q) => q.orientationType === activeType);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          Orientation Questions
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Questions clubs answer when submitting a request
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold font-['Geist'] transition-colors ${
              activeType === t.value
                ? "bg-[#180F04] text-[#D4A017]"
                : "bg-white border border-black/10 text-[#180F04]/60 hover:text-[#180F04]"
            }`}
          >
            {t.label} ({questions.filter((q) => q.orientationType === t.value).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#180F04]/30" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
          {filtered.map((q, i) => (
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
                  <button
                    onClick={() => handleEdit(q.id)}
                    className="text-[#180F04] hover:text-[#D4A017] transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-[#180F04]/30 hover:text-[#180F04] transition-colors"
                  >
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

          {filtered.length === 0 && addingFor !== activeType && (
            <div className="px-6 py-8 text-center text-[#180F04]/40 text-sm font-['Geist']">
              No questions for this type yet.
            </div>
          )}

          {addingFor === activeType ? (
            <div className="px-5 py-4 border-t border-black/5 flex items-start gap-2">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={2}
                placeholder="New question..."
                className="flex-1 border border-[#D4A017] rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none resize-none"
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={saving}
                className="text-[#180F04] hover:text-[#D4A017] transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button
                onClick={() => { setAddingFor(null); setNewText(""); }}
                className="text-[#180F04]/30 hover:text-[#180F04] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-black/5">
              <button
                onClick={() => setAddingFor(activeType)}
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
