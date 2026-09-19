import { Link } from "react-router-dom";
import logo from "../assets/study2gate-logo.png";
import { ArrowRight, BookOpen, Brain, Users, Upload, Download, Sparkles } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Find & share materials",
    text: "Access notes, past questions and other academic resources shared by students.",
  },
  {
    icon: Brain,
    title: "Study with flashcards",
    text: "Turn your study materials into flashcards and test yourself as you revise.",
  },
  {
    icon: Users,
    title: "Study Circles",
    text: "Create or join private study spaces and keep your group discussions organised.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <style>{`
        @keyframes study2gateLogoReveal {
          0% { opacity: 0; transform: translateY(12px) scale(.88); }
          65% { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes study2gateGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,100,210,.08); }
          50% { box-shadow: 0 0 0 16px rgba(20,100,210,0); }
        }
        .study2gate-logo-reveal {
          animation: study2gateLogoReveal .9s cubic-bezier(.2,.8,.2,1) both;
        }
        .study2gate-logo-glow {
          animation: study2gateGlow 2.2s ease-out .7s 1 both;
        }
        @media (prefers-reduced-motion: reduce) {
          .study2gate-logo-reveal,
          .study2gate-logo-glow { animation: none; }
        }
      `}</style>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Study2Gate home">
          <img src={logo} alt="Study2Gate logo" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-xl font-black tracking-tight">
            Study<span className="text-blue-600">2Gate</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            Create account
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="study2gate-logo-reveal study2gate-logo-glow mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-blue-50 p-3 shadow-sm ring-1 ring-blue-100 sm:h-28 sm:w-28">
            <img src={logo} alt="Study2Gate" className="h-full w-full rounded-2xl object-contain" />
          </div>

          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-600">Study2Gate</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Your academic resources.
            <br />
            Your study tools. <span className="text-blue-600">One place.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Find and share course materials, turn your notes into flashcards, and study with your classmates from one organised platform.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">What you can do</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Built around how students actually study.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-6xl gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300">
              <Upload className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-black">Upload. Earn credits. Download.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Share useful academic resources with the community. Each eligible upload gives you 2 download credits to use on other resources.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                <Download className="h-5 w-5" />
              </div>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="mt-5 text-2xl font-black">More than a file repository.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your materials can become part of your study workflow, from finding a resource to revising it with flashcards.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>Study2Gate · Academic resources and study tools.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/terms" className="hover:text-slate-900 hover:underline">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-slate-900 hover:underline">Privacy Policy</Link>
            <Link to="/copyright" className="hover:text-slate-900 hover:underline">Copyright Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
