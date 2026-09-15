// Shared helpers for the Download Credit System. The backend/database is
// always the source of truth for the balance (see backend/routes/files.js)
// — everything here is purely about keeping the Navbar badge in sync with
// that balance after an upload or download, the same way the app already
// syncs the profile picture (see the "study2gate-profile-picture-updated"
// event in Navbar.js).

export const CREDITS_UPDATED_EVENT = "study2gate-credits-updated";

// Tell every mounted DownloadCreditsBadge to update immediately, without
// waiting for its own next poll/refresh.
export function broadcastDownloadCredits(credits) {
  if (credits === null || credits === undefined) return;
  window.dispatchEvent(
    new CustomEvent(CREDITS_UPDATED_EVENT, { detail: { credits: Number(credits) } })
  );
}

// Downloads use `responseType: "blob"`, so a JSON error body (e.g. the
// 402 "out of credits" response) arrives as a Blob rather than parsed
// JSON — axios does not parse it for us. This reads and parses that blob
// back into the error payload so callers can check `code` and `message`.
// Returns null if the response isn't JSON or can't be parsed.
export async function readDownloadErrorPayload(error) {
  const data = error?.response?.data;
  if (!data) return null;

  // Already parsed (a non-blob error path, or a differently-configured
  // request) — nothing to do.
  if (typeof data === "object" && !(data instanceof Blob)) {
    return data;
  }

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  return null;
}
