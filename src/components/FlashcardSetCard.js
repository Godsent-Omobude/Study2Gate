import { Link } from "react-router-dom";
import { FileText, Trash2, ArrowRight } from "lucide-react";

export default function FlashcardSetCard({ set, onDelete }) {
  const count = set.flashcards?.length ?? 0;
  const date = set.createdAt
    ? new Date(set.createdAt).toLocaleDateString()
    : "Recently created";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-hover">
          <FileText className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-900">
            {set.title || "Untitled Flashcards"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {count} flashcards • {set.difficulty || "AI generated"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Created {date}</p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(set.id)}
          className="rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Delete flashcard set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/my-flashcards/${set.id}`}
          className="inline-flex items-center gap-1 rounded-xl border border-accent-soft px-4 py-2 text-xs font-bold text-accent-hover transition hover:bg-accent-soft"
        >
          Study <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
