import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import api from "../api/api";
import { CREDITS_UPDATED_EVENT } from "../utils/downloadCredits";

// Sits beside the NotificationBell in the Navbar (see App.js's
// ProtectedLayout). Matches the bell's own sizing/border/shadow so it
// reads as part of the same Navbar, not a bolted-on widget — no new
// design language introduced.
export default function DownloadCreditsBadge() {
  const [credits, setCredits] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = async () => {
    try {
      // The database is the source of truth for the balance; this is the
      // same /auth/me endpoint the rest of the app already has available
      // for "who am I, and what's my current state" (no new API pattern).
      const response = await api.get("/auth/me");
      setCredits(Number(response.data?.downloadCredits ?? 0));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  };

  useEffect(() => {
    load();

    const handleCreditsUpdated = (event) => {
      if (typeof event.detail?.credits === "number") {
        setCredits(event.detail.credits);
        setLoadFailed(false);
      }
    };

    window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);
    return () => window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);
  }, []);

  // Loading state: a quiet placeholder pill the same shape as the loaded
  // badge, so nothing jumps around once the real number arrives.
  if (credits === null && !loadFailed) {
    return (
      <div
        aria-hidden="true"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 shadow-sm"
      >
        <Coins className="h-4 w-4 text-slate-300" />
        <span className="h-3 w-6 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  // Error state: fail quietly rather than block the Navbar — same
  // approach NotificationBell already takes when its own load fails.
  if (loadFailed) {
    return null;
  }

  return (
    <div
      title="Download credits"
      aria-label={`${credits} download credit${credits === 1 ? "" : "s"} remaining`}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 shadow-sm"
    >
      <Coins className="h-4 w-4 text-brand-blue" />
      <span className="text-sm font-black tabular-nums">{credits}</span>
      <span className="hidden text-xs font-bold text-slate-400 sm:inline">
        {credits === 1 ? "credit" : "credits"}
      </span>
    </div>
  );
}
