"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, type OptionKey } from "@/data/questions";
import { evaluateAnswers, encodeAnswers } from "@/data/scoring";
import { trackEvent, type ProgressStep } from "@/lib/analytics";

const TOTAL = QUESTIONS.length;
const STORAGE_KEY = "karada-shindan:progress:v1";

interface SavedProgress {
  v: 1;
  /** 1-origin の設問番号。URLの ?q= と同じ値 */
  q: number;
  /** "ABCD..." 形式。先頭から連続して埋まる */
  answers: string;
}

/** URLの ?q= を 1..TOTAL の設問番号として読む。無い・壊れている場合は null */
function readQuestionParam(search: string): number | null {
  const raw = new URLSearchParams(search).get("q");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL ? n : null;
}

const pathFor = (index: number) => (index === 0 ? "/diagnosis" : `/diagnosis?q=${index + 1}`);

/**
 * 診断の進行状態を持つ外部ストア。
 *
 * 状態のソースは2つある。
 *   - 現在の設問番号 … URLの ?q=（1設問 = 1履歴エントリ。ブラウザバックで1問戻る）
 *   - 回答           … メモリ上の配列。localStorage へはミラーするだけ
 *
 * 回答をメモリで持つことで、プライベートブラウズなどで localStorage が
 * 使えない環境でも、その場の診断は最後まで通る（復元だけができなくなる）。
 *
 * popstate を購読するので useSyncExternalStore から使う。
 */
const progressStore = (() => {
  const UNINITIALIZED = "-";
  let answers: OptionKey[] = [];
  let initialized = false;
  let snapshot = UNINITIALIZED;
  const listeners = new Set<() => void>();

  function readStorage(): OptionKey[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedProgress;
      if (parsed?.v !== 1 || typeof parsed.answers !== "string") return [];
      if (!/^[A-D]*$/.test(parsed.answers) || parsed.answers.length > TOTAL) return [];
      return parsed.answers.split("") as OptionKey[];
    } catch {
      return [];
    }
  }

  function writeStorage(q: number) {
    try {
      const payload: SavedProgress = { v: 1, q, answers: answers.join("") };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 保存できなくても回答は続けられる
    }
  }

  function clearStorage() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 何もしない
    }
  }

  /** "初期化済み|設問番号|回答" の文字列。値が変わったときだけ購読者に通知する */
  function refresh() {
    if (!initialized) return;
    const q = readQuestionParam(window.location.search) ?? 1;
    const next = `1|${q}|${answers.join("")}`;
    if (next === snapshot) return;
    snapshot = next;
    for (const listener of listeners) listener();
  }

  return {
    subscribe(onChange: () => void) {
      listeners.add(onChange);
      // 同じ関数参照なので重複登録されない
      window.addEventListener("popstate", refresh);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("popstate", refresh);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => UNINITIALIZED,

    /**
     * マウント時に1回だけ呼ぶ。
     * ?q= 付きで来た = リロード／タブ復帰 なので保存済みの回答から復元する。
     * ?q= なしで来た = 新しく始める ので、前回の中断データは持ち越さない。
     *
     * 戻り値の resumed は「途中から再開したかどうか」。計測でしか使わない。
     */
    init(): { resumed: boolean } {
      const q = readQuestionParam(window.location.search);
      if (q === null) {
        answers = [];
        clearStorage();
      } else {
        answers = readStorage();
        // 未回答の設問より先には進めないので、URLが行き過ぎていたら巻き戻す
        const index = Math.min(q - 1, answers.length);
        if (index !== q - 1) window.history.replaceState(null, "", pathFor(index));
      }
      initialized = true;
      snapshot = UNINITIALIZED;
      refresh();
      return { resumed: answers.length > 0 };
    },

    /** 画面から離れたら未初期化に戻す。次のマウントで古い状態が一瞬見えるのを防ぐ */
    teardown() {
      initialized = false;
      answers = [];
      snapshot = UNINITIALIZED;
    },

    /** 回答を記録して次の設問へ。履歴を1つ積むのでブラウザバックでここに戻れる */
    answer(index: number, key: OptionKey) {
      const next = [...answers];
      next[index] = key; // 戻って選び直した場合は上書きし、それ以降の回答は保持する
      answers = next;
      const nextIndex = index + 1;
      writeStorage(nextIndex + 1);
      window.history.pushState(null, "", pathFor(nextIndex));
      refresh();
    },

    /** 完走したので途中データを破棄する */
    complete() {
      clearStorage();
    },

    currentAnswers: () => answers,
  };
})();

function parseSnapshot(snapshot: string): { q: number; answers: OptionKey[] } | null {
  if (snapshot === "-") return null;
  const [, q, answers] = snapshot.split("|");
  return { q: Number(q), answers: answers.split("") as OptionKey[] };
}

/** 進捗を送る節目。全30問のうちこの5点だけを見る */
const PROGRESS_STEPS: ProgressStep[] = [5, 10, 15, 20, 25];

export function DiagnosisFlow() {
  const router = useRouter();
  // 戻って選び直したときに同じ節目を二重送信しないよう、送信済みを覚えておく
  const sentSteps = useRef<Set<ProgressStep>>(new Set());
  const snapshot = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot
  );

  useEffect(() => {
    // 依存が空なので、再レンダーでは動かない（マウント1回につき1件）
    const { resumed } = progressStore.init();
    trackEvent("diagnosis_start", { resumed });
    return () => progressStore.teardown();
  }, []);

  const state = parseSnapshot(snapshot);
  const qIndex = state ? Math.min(state.q - 1, state.answers.length) : null;

  const handleSelect = useCallback(
    (index: number, key: OptionKey) => {
      // 送るのは「何問目まで進んだか」だけ。何を選んだかは送らない
      const answered = index + 1;
      const step = PROGRESS_STEPS.find((s) => s === answered);
      if (step !== undefined && !sentSteps.current.has(step)) {
        sentSteps.current.add(step);
        trackEvent("question_progress", { step });
      }

      if (index < TOTAL - 1) {
        progressStore.answer(index, key);
        return;
      }
      // 最終問。ここで初めて結果を確定させる
      const final = [...progressStore.currentAnswers()];
      final[index] = key;
      if (final.length !== TOTAL || final.some((a) => !a)) return; // 念のため
      progressStore.complete();
      trackEvent("diagnosis_complete");
      const result = evaluateAnswers(final);
      router.push(`/result/${result.type.id}?a=${encodeAnswers(final)}`);
    },
    [router]
  );

  // ブラウザバックと同じ経路に統一して、履歴と表示がずれないようにする
  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  if (qIndex === null) {
    // 復元が終わるまで設問を出さない（Q1が一瞬見えてから飛ぶのを防ぐ）
    return (
      <div className="w-full max-w-lg">
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-black/5" />
        <div className="rounded-[28px] bg-white p-7 shadow-[var(--card-shadow)]">
          <p className="text-center text-sm text-ink-soft">読み込み中...</p>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[qIndex];
  const selected = state?.answers[qIndex];
  const progress = Math.round(((qIndex + 1) / TOTAL) * 100);

  return (
    <div className="w-full max-w-lg">
      <div
        className="mb-4 h-2 w-full overflow-hidden rounded-full bg-black/5"
        role="progressbar"
        aria-valuenow={qIndex + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-label="診断の進捗"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        key={question.id}
        className="animate-pop-in rounded-[28px] bg-white p-7 shadow-[var(--card-shadow)]"
      >
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink-soft">
          <span>
            Q{question.id} / {TOTAL}
          </span>
          {qIndex > 0 && (
            <button onClick={handleBack} className="underline underline-offset-2">
              ひとつ戻る
            </button>
          )}
        </div>
        {/* 設問が切り替わったことを支援技術に伝える。
            カード全体に付けると選択肢4つまで毎回読み上げられて冗長になるので、設問文だけにしている */}
        <p aria-live="polite" className="mb-6 text-lg font-bold leading-relaxed">
          {question.text}
        </p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(qIndex, opt.key)}
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? "flex items-center justify-between gap-2 rounded-2xl border-2 border-accent bg-accent-light px-4 py-3.5 text-left text-[0.95rem] font-bold leading-snug text-ink transition active:scale-[0.98]"
                    : "flex items-center justify-between gap-2 rounded-2xl border-2 border-accent-light bg-[#fcf9ff] px-4 py-3.5 text-left text-[0.95rem] leading-snug text-ink transition hover:border-accent hover:bg-accent-light active:scale-[0.98]"
                }
              >
                <span>{opt.text}</span>
                {isSelected && (
                  <span aria-hidden className="shrink-0 text-accent">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selected && (
          <p className="mt-3 text-center text-xs text-ink-soft">
            前回はこれを選びました。変えたい選択肢をタップしてください。
          </p>
        )}
      </div>
    </div>
  );
}
