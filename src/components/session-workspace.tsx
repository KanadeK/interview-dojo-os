"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question, RubricScore } from "@/domain/model";

type Detail = {
  session: { id: string; startedAt: string; includeAnswerInExport: boolean };
  question: Question;
  answers: Array<{ content: string }>;
  scores: RubricScore[];
  timeline: Array<{ id: string; type: string; detail: string; occurredAt: string }>;
};
export function SessionWorkspace({ initial }: { initial: Detail }) {
  const [detail, setDetail] = useState(initial);
  const [answer, setAnswer] = useState(initial.answers.at(-1)?.content ?? "");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [seconds, setSeconds] = useState(() =>
    Math.floor((Date.now() - new Date(initial.session.startedAt).getTime()) / 1000),
  );
  useEffect(() => {
    setHydrated(true);
    const timer = window.setInterval(
      () =>
        setSeconds(Math.floor((Date.now() - new Date(detail.session.startedAt).getTime()) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [detail.session.startedAt]);
  const refresh = async () => {
    const response = await fetch(`/api/sessions/${detail.session.id}`, { cache: "no-store" });
    setDetail((await response.json()) as Detail);
  };
  async function update(payload: object) {
    const response = await fetch(`/api/sessions/${detail.session.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Update failed");
    await refresh();
  }
  async function saveAnswer() {
    try {
      const draft = (document.getElementById("answer") as HTMLTextAreaElement).value;
      await update({ action: "answer", content: draft });
      setNotice("Version saved to this device.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save answer");
    }
  }
  async function score() {
    try {
      const scores = detail.question.rubric.map((criterion) => ({
        criterionId: criterion.id,
        score: Number(
          (document.getElementById(`score-${criterion.id}`) as HTMLSelectElement).value,
        ),
        note: (document.getElementById(`note-${criterion.id}`) as HTMLInputElement).value,
      }));
      await update({ action: "rubric", scores });
      setNotice("Self-assessment recorded. This is not a hiring decision.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to score rubric");
    }
  }
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <main className="workspace">
      <Link href="/">← Library</Link>
      <p className="timer" aria-live="polite">
        Elapsed {duration}
      </p>
      <h1>{detail.question.title}</h1>
      <p>{detail.question.prompt}</p>
      <p className="tags">{detail.question.topics.join(" · ")}</p>
      {notice && <p role="status">{notice}</p>}
      <section>
        <h2>Answer versions</h2>
        <label htmlFor="answer">Your local answer</label>
        <textarea
          id="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={14}
          disabled={!hydrated}
        />
        <button onClick={saveAnswer} disabled={!hydrated}>
          Save answer version
        </button>
        <p>{detail.answers.length} persisted version(s)</p>
      </section>
      <section>
        <h2>Transparent self-assessment</h2>
        <p>Scores are your own practice notes; they do not predict hiring outcomes.</p>
        {detail.question.rubric.map((criterion) => (
          <fieldset key={criterion.id}>
            <legend>
              {criterion.label} ({criterion.weight}×)
            </legend>
            <p>{criterion.guidance}</p>
            <label htmlFor={`score-${criterion.id}`}>Score</label>
            <select
              id={`score-${criterion.id}`}
              defaultValue={
                detail.scores.find((score) => score.criterionId === criterion.id)?.score ?? 0
              }
            >
              {[0, 1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} / 4
                </option>
              ))}
            </select>
            <label htmlFor={`note-${criterion.id}`}>Note</label>
            <input
              id={`note-${criterion.id}`}
              defaultValue={
                detail.scores.find((score) => score.criterionId === criterion.id)?.note ?? ""
              }
            />
          </fieldset>
        ))}
        <button onClick={score}>Record rubric</button>
      </section>
      <section>
        <h2>Export privacy</h2>
        <label>
          <input
            type="checkbox"
            checked={detail.session.includeAnswerInExport}
            onChange={async (event) => {
              try {
                await update({ action: "privacy", includeAnswer: event.target.checked });
                setNotice("Export privacy preference saved.");
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Unable to update privacy");
              }
            }}
          />{" "}
          Include the latest local answer in the exported report
        </label>
        <p>Answers are excluded by default.</p>
        <a className="button-link" href={`/api/sessions/${detail.session.id}/report`}>
          Download training report
        </a>
      </section>
      <section>
        <h2>Replay timeline</h2>
        <ol>
          {detail.timeline.map((event) => (
            <li key={event.id}>
              <time>{new Date(event.occurredAt).toLocaleString()}</time> — {event.detail}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
