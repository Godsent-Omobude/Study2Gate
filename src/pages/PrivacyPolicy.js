import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "Information we collect",
    body: [
      "Account details you provide when registering: full name, username, email address, matric number (if applicable), and password (stored as a salted hash, never in plain text).",
      "Content you create or upload: study materials and documents you submit for flashcard generation, the flashcards and study sessions generated from them, study circle messages, pinned notes, and your study streak history.",
      "Optional profile settings: profile picture, display theme, and accent colour.",
      "Push notification data: if you enable push notifications, a device token used to deliver them, and your per-category notification preferences.",
      "Technical data collected automatically: log data such as IP address and browser/device information, used for security and troubleshooting.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To provide core functionality: authenticating your account, generating flashcards from your uploaded materials using AI, running study circles and chat, and tracking study streaks.",
      "To send notifications you've opted into, such as circle messages, mentions, and account security alerts.",
      "To maintain the security and integrity of the platform, including detecting abuse and enforcing rate limits.",
    ],
  },
  {
    title: "AI processing",
    body: [
      "When you generate flashcards, the study material you upload is sent to a third-party AI provider (Google's Gemini API) for processing. Avoid uploading material you don't have the right to share.",
    ],
  },
  {
    title: "Sharing of information",
    body: [
      "We do not sell your personal information.",
      "Content you post in a study circle (messages, pinned notes, shared materials) is visible to other members of that circle.",
      "We use third-party service providers to operate the platform, including cloud file storage, database hosting, and push notification delivery (Firebase Cloud Messaging). These providers process data only as needed to provide their service to us.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "We retain your account and content for as long as your account is active. You can delete individual content (flashcard sets, messages you've sent, etc.) from within the app where that option is available.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can update your profile details, theme, and notification preferences at any time in Settings.",
      "You can disable push notifications altogether, or by category, in Settings.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about this policy or your data can be directed to the Study2Gate team through the app's support channel.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-bold text-accent hover:text-accent-hover">
          &larr; Back to Study2Gate
        </Link>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">
            This policy explains what information Study2Gate collects, how it's used, and the
            choices you have.
          </p>

          <div className="mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-black text-slate-900">{section.title}</h2>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
            Also see our{" "}
            <Link to="/terms" className="font-bold text-accent hover:underline">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link to="/copyright" className="font-bold text-accent hover:underline">
              Copyright Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
