"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  endpoint: string;
  label?: string;
  confirmMessage?: string;
  className?: string;
  onDeleted?: () => void;
}

export default function DeleteButton({ endpoint, label, confirmMessage, className, onDeleted }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(confirmMessage ?? "Delete this record? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(endpoint, { method: "DELETE" });
      if (onDeleted) onDeleted();
      else router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Delete"
      className={className ?? "flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-40"}
    >
      <Trash2 size={13} />
      {label && <span>{loading ? "Deleting..." : label}</span>}
    </button>
  );
}
