import { useSettings } from "./SettingsContext";

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function SettingsStanding() {
  const { settings } = useSettings();

  const isSuspended =
    settings.suspendedUntil && new Date(settings.suspendedUntil) > new Date();
  const warnings = settings.copyrightWarnings || 0;
  const isClear = !isSuspended && warnings === 0;

  return (
    <div className="space-y-5">
      <section
        className={`rounded-3xl border p-6 ${
          isSuspended
            ? "border-red-200 bg-red-50"
            : warnings > 0
            ? "border-amber-200 bg-amber-50"
            : "border-green-200 bg-green-50"
        }`}
      >
        <h2
          className={`text-xl font-black ${
            isSuspended
              ? "text-red-800"
              : warnings > 0
              ? "text-amber-800"
              : "text-green-800"
          }`}
        >
          {isSuspended
            ? "Account suspended"
            : warnings > 0
            ? "In good standing, with warnings on file"
            : "Your account is in good standing"}
        </h2>

        {isSuspended && (
          <div className="mt-3 space-y-1 text-sm text-red-700">
            <p>
              Your account is suspended until{" "}
              <span className="font-bold">{formatDate(settings.suspendedUntil)}</span>.
            </p>
            {settings.suspendedReason && <p>Reason: {settings.suspendedReason}</p>}
          </div>
        )}

        {!isSuspended && isClear && (
          <p className="mt-2 text-sm text-green-700">
            No copyright warnings and no active restrictions on your account.
          </p>
        )}

        {!isSuspended && !isClear && (
          <p className="mt-2 text-sm text-amber-700">
            Your account isn't restricted right now, but repeated copyright warnings
            can lead to a suspension — see the copyright policy for details.
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Copyright warnings</h2>
        <p className="mt-2 text-sm text-slate-500">
          Issued when a material you uploaded is found to violate Study2Gate's
          copyright policy. Multiple warnings may lead to a temporary suspension.
        </p>
        <p className="mt-4 text-3xl font-black text-slate-800">
          {warnings} warning{warnings === 1 ? "" : "s"}
        </p>
      </section>
    </div>
  );
}
