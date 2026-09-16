import { useEffect, useState } from "react";
import api from "../api/api";

// Module-level, not component state — this persists across Sidebar/Navbar/
// Dashboard mounting and unmounting on every route change, so the picture
// is fetched once per session (until it actually changes) instead of once
// per component per navigation.
let cachedKey = null;
let cachedUrl = "";
let inFlight = null;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(cachedUrl));
};

const setCachedUrl = (nextUrl) => {
  if (cachedUrl && cachedUrl !== nextUrl) {
    URL.revokeObjectURL(cachedUrl);
  }
  cachedUrl = nextUrl;
  notify();
};

const fetchPicture = (key) => {
  // If a fetch is already in flight (e.g. Sidebar and Navbar both mounted
  // this render), everyone waits on the same request instead of firing a
  // second one.
  if (inFlight) return inFlight;

  inFlight = api
    .get("/settings/profile-picture", { responseType: "blob" })
    .then((response) => {
      cachedKey = key;
      if (!response.data || response.data.size === 0) {
        setCachedUrl("");
      } else {
        setCachedUrl(URL.createObjectURL(response.data));
      }
    })
    .catch(() => {
      cachedKey = key;
      setCachedUrl("");
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

export default function useProfilePicture() {
  const [url, setUrl] = useState(cachedUrl);

  useEffect(() => {
    listeners.add(setUrl);
    setUrl(cachedUrl);

    const key = localStorage.getItem("profilePicture");
    if (!key) {
      if (cachedKey !== null) {
        cachedKey = null;
        setCachedUrl("");
      }
    } else if (key !== cachedKey) {
      fetchPicture(key);
    }

    // Fired by Settings after an upload/remove, once the new key is
    // already in localStorage — re-check and refetch if it actually changed.
    const handleUpdated = () => {
      const nextKey = localStorage.getItem("profilePicture");
      if (!nextKey) {
        cachedKey = null;
        setCachedUrl("");
        return;
      }
      if (nextKey !== cachedKey) {
        fetchPicture(nextKey);
      }
    };
    window.addEventListener("study2gate-profile-picture-updated", handleUpdated);

    return () => {
      listeners.delete(setUrl);
      window.removeEventListener("study2gate-profile-picture-updated", handleUpdated);
    };
  }, []);

  return url;
}
