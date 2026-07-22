"use client";
import { useState } from "react";
import type { Question } from "@/domain/model";

export function QuestionLibrary({ questions }: { questions: Question[] }) {
  const [error, setError] = useState("");
  async function begin(questionId: string) {
    setError("");
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const data = (await response.json()) as { session?: { id: string }; error?: string };
    if (!response.ok || !data.session) {
      setError(data.error ?? "Unable to begin session");
      return;
    }
    window.location.assign(`/sessions/${data.session.id}`);
  }
  return (
    <section aria-labelledby="library-heading">
      <h2 id="library-heading">Local question library</h2>
      {error && <p role="alert">{error}</p>}
      <div className="cards">
        {questions.map((question) => (
          <article className="card" key={question.id}>
            <p className="eyebrow">{question.kind}</p>
            <h3>{question.title}</h3>
            <p>{question.prompt}</p>
            <p className="tags">{question.topics.join(" · ")}</p>
            <button onClick={() => begin(question.id)}>Start timed session</button>
          </article>
        ))}
      </div>
    </section>
  );
}
