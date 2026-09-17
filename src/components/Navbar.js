import React from "react";
import { Menu } from "lucide-react";
import useProfilePicture from "../hooks/useProfilePicture";

export default function Navbar({ onMenuOpen, children }) {
  const userName = localStorage.getItem("fullName") || "Student";
  const profileInitial = (userName.trim()[0] || "S").toUpperCase();
  const profilePictureUrl = useProfilePicture();

  return (
    <nav className="sticky top-0 z-30 h-[72px] border-b border-slate-200/90 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
      <div className="mx-auto flex h-full w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
            aria-expanded={false}
            className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-accent-soft hover:bg-accent-soft hover:text-accent active:scale-95"
          >
            <Menu className="h-[25px] w-[25px] transition group-hover:scale-95" strokeWidth={2} />
          </button>

          <div className="text-[25px] font-black tracking-[-0.04em] text-accent sm:text-[28px]">
            Study2Gate
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {children}

          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={`${userName}'s profile`}
              title={userName}
              aria-label={`Logged in as ${userName}`}
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-md shadow-accent-soft ring-4 ring-accent-soft"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-base font-black text-white shadow-md shadow-accent-soft ring-4 ring-accent-soft"
              title={userName}
              aria-label={`Logged in as ${userName}`}
            >
              {profileInitial}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
