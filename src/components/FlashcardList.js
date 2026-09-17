import { useEffect, useMemo, useState } from "react";
import { Flame, X, ArrowLeft, ArrowRight, Check, Flag, PartyPopper } from "lucide-react";
import Flashcard from "./Flashcard";
import StreakCelebration from "./StreakCelebration";
import api from "../api/api";

// Minimum distinct cards a user must engage with (flip in Normal Mode, or
// answer in Test Yourself) in one sitting for it to count as a study day.
// Generating or merely opening a set doesn't count on its own.
const MIN_CARDS_FOR_STREAK = 5;

export default function FlashcardList({
  flashcards = [],
  title = "Your Flashcards",
  flashcardSetId = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState("normal");
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scores, setScores] = useState({});
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Streak tracking. engagedCards holds every distinct card the user has
  // flipped (Normal Mode) or answered (Test Yourself) this session — both
  // modes contribute to the same qualifying count.
  const [engagedCards, setEngagedCards] = useState(new Set());
  const [streakRequested, setStreakRequested] = useState(false);
  const [streakCelebration, setStreakCelebration] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(null);
  const [longestStreak, setLongestStreak] = useState(null);

  useEffect(() => {
    setCurrentIndex(0);
    setMode("normal");
    setEvaluation(null);
    setIsEvaluating(false);
    setScores({});
    setSessionStarted(false);
    setSessionFinished(false);
    setIsSavingResult(false);
    setResultSaved(false);
    setSaveError("");
    setEngagedCards(new Set());
    setStreakRequested(false);
    setStreakCelebration(null);
  }, [flashcards]);

  // Load the user's existing streak once, so it's visible even before
  // today's session qualifies.
  useEffect(() => {
    if (!flashcardSetId) return;

    let cancelled = false;

    api
      .get("/ai/streak")
      .then((response) => {
        if (cancelled) return;
        const streak = response.data?.streak;
        if (streak) {
          setCurrentStreak(streak.currentStreak);
          setLongestStreak(streak.longestStreak);
        }
      })
      .catch(() => {
        // Non-critical — the study session itself isn't affected.
      });

    return () => {
      cancelled = true;
    };
  }, [flashcardSetId]);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length
    ? ((currentIndex + 1) / flashcards.length) * 100
    : 0;

  const completedCount = Object.keys(scores).length;
  const averageScore = useMemo(() => {
    if (!completedCount) return 0;
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total / completedCount);
  }, [scores, completedCount]);

  const markCardEngaged = (cardKey) => {
    setEngagedCards((current) => {
      if (current.has(cardKey)) return current;
      const next = new Set(current);
      next.add(cardKey);
      return next;
    });
  };

  // Record a study session the moment the qualifying threshold is
  // reached — not at the end of the deck — so the streak is protected
  // even if the user closes the browser right away.
  useEffect(() => {
    if (
      !flashcardSetId ||
      streakRequested ||
      engagedCards.size < MIN_CARDS_FOR_STREAK
    ) {
      return;
    }

    let cancelled = false;
    setStreakRequested(true);

    api
      .post("/ai/streak", { completedCount: engagedCards.size })
      .then((response) => {
        if (cancelled) return;
        const streak = response.data?.streak;
        if (!streak) return;

        setCurrentStreak(streak.currentStreak);
        setLongestStreak(streak.longestStreak);

        if (response.data?.streakUpdated) {
          setStreakCelebration({
            type: "updated",
            currentStreak: streak.currentStreak,
          });
        } else if (response.data?.alreadyRecorded) {
          setStreakCelebration({
            type: "protected",
            currentStreak: streak.currentStreak,
          });
        }
      })
      .catch(() => {
        // Streak tracking is best-effort and shouldn't interrupt studying.
      });

    return () => {
      cancelled = true;
    };
  }, [engagedCards, flashcardSetId, streakRequested]);

  // Explicit completion action, triggered by the "Finish Review" button.
  // If the background auto-save above already reported to the backend
  // today (streakRequested), there's nothing left to send — this only
  // makes the call when the user finishes without ever crossing the
  // qualifying threshold mid-session (e.g. a short deck), so they still
  // get an accurate result instead of silence.
  const finishSession = async () => {
    if (sessionFinished) return;
    setSessionFinished(true);

    if (!flashcardSetId || streakRequested) return;

    setStreakRequested(true);

    try {
      const response = await api.post("/ai/streak", {
        completedCount: engagedCards.size,
      });
      const streak = response.data?.streak;
      if (!streak) return;

      setCurrentStreak(streak.currentStreak);
      setLongestStreak(streak.longestStreak);

      if (response.data?.streakUpdated) {
        setStreakCelebration({
          type: "updated",
          currentStreak: streak.currentStreak,
        });
      } else if (response.data?.alreadyRecorded) {
        setStreakCelebration({
          type: "protected",
          currentStreak: streak.currentStreak,
        });
      } else if (response.data?.qualified === false) {
        setStreakCelebration({
          type: "not-qualified",
          message: response.data.message,
        });
      }
    } catch {
      // Streak tracking is best-effort and shouldn't block finishing.
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setEvaluation(null);
    setSessionStarted(nextMode === "test");
  };

  const submitAnswer = async (answer) => {
    if (!currentCard || isEvaluating) return;

    try {
      setIsEvaluating(true);
      const response = await api.post("/ai/flashcards/evaluate", {
        question: currentCard.front,
        expectedAnswer: currentCard.back,
        userAnswer: answer,
      });

      const result = response.data?.evaluation;
      if (!result) {
        throw new Error("No evaluation was returned.");
      }

      setEvaluation(result);
      setScores((current) => ({
        ...current,
        [currentCard.id ?? currentIndex]: Number(result.score) || 0,
      }));
      markCardEngaged(currentCard.id ?? currentIndex);
      setSessionStarted(true);
    } catch (error) {
      setEvaluation({
        score: 0,
        verdict: "Evaluation unavailable",
        feedback:
          error.response?.data?.message ||
          "We could not evaluate your answer. Please try again.",
        missedPoints: [],
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const savePracticeResult = async () => {
    if (!flashcardSetId || !completedCount || isSavingResult || resultSaved) return;

    try {
      setIsSavingResult(true);
      setSaveError("");

      await api.post(`/ai/flashcards/${flashcardSetId}/practice-result`, {
        score: averageScore,
        completedCount
      });

      setResultSaved(true);
    } catch (error) {
      setSaveError(
        error.response?.data?.message ||
          "Unable to save your practice result. Please try again."
      );
    } finally {
      setIsSavingResult(false);
    }
  };

  const next = () => {
    setCurrentIndex((index) =>
      Math.min(flashcards.length - 1, index + 1)
    );
    setEvaluation(null);
  };

  const previous = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setEvaluation(null);
  };

  if (!flashcards.length) return null;

  const isLastCard = currentIndex === flashcards.length - 1;
  const testComplete = mode === "test" && isLastCard && evaluation;
  const canFinish =
    isLastCard && (mode === "normal" || !!evaluation) && !sessionFinished;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
          {typeof currentStreak === "number" && currentStreak > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs font-black text-amber-600">
              <Flame className="h-3.5 w-3.5" /> {currentStreak}-day streak
            </p>
          )}
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => switchMode("normal")}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
              mode === "normal"
                ? "bg-accent text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => switchMode("test")}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
              mode === "test"
                ? "bg-accent text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Test Yourself
          </button>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {streakCelebration?.type === "updated" && (
        <StreakCelebration
          streak={streakCelebration.currentStreak}
          longestStreak={longestStreak}
          onClose={() => setStreakCelebration(null)}
        />
      )}

      {streakCelebration?.type === "protected" && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black text-emerald-900">
              <Flame className="h-4 w-4" /> Streak protected!
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">You already studied today. Come back tomorrow to extend it.</p>
          </div>
          <button type="button" onClick={() => setStreakCelebration(null)} className="text-emerald-500 hover:text-emerald-700" aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {streakCelebration?.type === "not-qualified" && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-black text-slate-700">Almost there</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{streakCelebration.message || `Complete at least ${MIN_CARDS_FOR_STREAK} flashcards to count today toward your streak.`}</p>
          </div>
          <button type="button" onClick={() => setStreakCelebration(null)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {mode === "test" && (
        <div className="mb-5 rounded-2xl border border-accent-soft bg-accent-soft p-4">
          <p className="text-sm font-bold text-accent-hover">
            Test Yourself
          </p>
          <p className="mt-1 text-xs leading-5 text-accent-hover">
            Type what you know first. Your answer will be scored before the
            correct answer can be revealed.
          </p>
        </div>
      )}

      <Flashcard
        key={currentIndex}
        front={currentCard.front}
        back={currentCard.back}
        mode={mode}
        evaluation={evaluation}
        isEvaluating={isEvaluating}
        onSubmitAnswer={submitAnswer}
        onRevealAnswer={() => {
          if (mode === "normal") {
            markCardEngaged(currentCard.id ?? currentIndex);
          }
        }}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previous}
          disabled={currentIndex === 0 || isEvaluating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {canFinish ? (
          <button
            type="button"
            onClick={finishSession}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <Flag className="h-4 w-4" /> Finish Review
          </button>
        ) : sessionFinished ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
            <Check className="h-4 w-4" /> Review Finished
          </span>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={
              isLastCard ||
              isEvaluating ||
              (mode === "test" && !evaluation)
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {mode === "test" && sessionStarted && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Answered
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {completedCount}/{flashcards.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Average score
            </p>
            <p className="mt-1 text-2xl font-black text-accent">
              {averageScore}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Progress
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {Math.round((completedCount / flashcards.length) * 100)}%
            </p>
          </div>
        </div>
      )}

      {sessionFinished && mode === "normal" && (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <PartyPopper className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-2 text-xl font-black text-slate-900">
            Review complete
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            You reviewed {engagedCards.size} of {flashcards.length} cards.
          </p>
        </div>
      )}

      {testComplete && (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <PartyPopper className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-2 text-xl font-black text-slate-900">
            Test session complete
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            You answered {completedCount} of {flashcards.length} cards.
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-600">
            {averageScore}%
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Average score
          </p>

          {flashcardSetId && (
            <>
              <button
                type="button"
                onClick={savePracticeResult}
                disabled={isSavingResult || resultSaved}
                className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {resultSaved
                  ? (<span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Practice Result Saved</span>)
                  : isSavingResult
                  ? "Saving Result..."
                  : "Save Practice Result"}
              </button>

              {saveError && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {saveError}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
