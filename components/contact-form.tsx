"use client";

import { LoaderCircle, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "sending" | "success" | "error";

type ContactResponse = {
  error?: string;
  remaining?: number;
};

// Same field treatment as the catalogue filter: the label sits inside the bordered box, and
// the box carries the hover/focus state for whatever control it wraps.
const fieldFrameClass =
  "relative block rounded-md border border-control bg-white transition-colors hover:border-forest focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20 has-disabled:opacity-65";

const fieldLabelClass =
  "pointer-events-none absolute top-2.5 left-4 text-xs leading-4 font-semibold text-meta";

const inputClass =
  "h-16 w-full rounded-md bg-transparent px-4 pt-6 text-base text-ink placeholder:text-meta/70 focus:outline-none disabled:cursor-wait";

export function ContactForm() {
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    setSubmissionState("sending");
    setNotice("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, description }),
      });

      const result = (await response
        .json()
        .catch(() => ({}))) as ContactResponse;

      if (response.status === 429 || result.error === "rate_limited") {
        setSubmissionState("error");
        setNotice(
          "24 საათში მაქსიმუმ 3 წერილის გაგზავნა შეგიძლიათ. გთხოვთ, მოგვიანებით სცადოთ.",
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Contact request failed");
      }

      formElement.reset();
      setSubmissionState("success");
      setNotice(
        result.remaining === 0
          ? "წერილი წარმატებით გაიგზავნა. 24 საათის ლიმიტი ამოიწურა."
          : "წერილი წარმატებით გაიგზავნა. მალე დაგიკავშირდებით.",
      );
    } catch {
      setSubmissionState("error");
      setNotice("წერილი ვერ გაიგზავნა. გთხოვთ, ცოტა ხანში ხელახლა სცადოთ.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={submissionState === "sending"}
      aria-describedby="contact-privacy-note contact-form-notice"
      className="rounded-lg bg-white p-5 shadow-card sm:p-7 lg:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest">
          <Mail className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold tracking-[-0.015em] text-ink sm:text-2xl">
          მოგვწერეთ
        </h2>
      </div>

      <div className="mt-7 space-y-5">
        <label className={fieldFrameClass}>
          <span className={fieldLabelClass}>თქვენი ელფოსტა</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={submissionState === "sending"}
            placeholder="name@example.com"
            className={inputClass}
          />
        </label>

        <label className={fieldFrameClass}>
          <span className={fieldLabelClass}>სათაური</span>
          <input
            type="text"
            name="subject"
            required
            maxLength={120}
            disabled={submissionState === "sending"}
            placeholder="რის შესახებ გვწერთ?"
            className={inputClass}
          />
        </label>

        <label className={fieldFrameClass}>
          {/* In flow, not absolute: a scrolled textarea would slide its text under an
              overlaid label. */}
          <span className="block px-4 pt-2.5 text-xs leading-4 font-semibold text-meta">
            აღწერა
          </span>
          <textarea
            name="description"
            required
            maxLength={2000}
            rows={6}
            disabled={submissionState === "sending"}
            placeholder="დაწერეთ თქვენი კითხვა ან კომენტარი"
            className="block w-full resize-y rounded-b-md bg-transparent px-4 pt-1 pb-3 text-base leading-7 text-ink placeholder:text-meta/70 focus:outline-none disabled:cursor-wait"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submissionState === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-forest-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-65 sm:w-auto"
      >
        {submissionState === "sending" ? (
          <>
            იგზავნება...
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            გაგზავნა
            <Send className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p id="contact-privacy-note" className="mt-4 max-w-xl text-sm leading-6 text-ink-muted">
        წერილი პირდაპირ Home Mix-ის ელფოსტაზე გაიგზავნება. თქვენი ელფოსტა მხოლოდ
        პასუხისთვის გამოიყენება.
      </p>
      {notice ? (
        <p
          id="contact-form-notice"
          role={submissionState === "error" ? "alert" : "status"}
          className={`mt-3 text-sm font-medium leading-6 ${submissionState === "error" ? "text-danger" : "text-forest"}`}
        >
          {notice}
        </p>
      ) : null}
    </form>
  );
}
