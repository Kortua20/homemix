"use client";

import { LoaderCircle, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "sending" | "success" | "error";

type ContactResponse = {
  error?: string;
  remaining?: number;
};

export function ContactForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
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

      const result = (await response.json().catch(() => ({}))) as ContactResponse;

      if (response.status === 429 || result.error === "rate_limited") {
        setSubmissionState("error");
        setNotice("24 საათში მაქსიმუმ 3 წერილის გაგზავნა შეგიძლიათ. გთხოვთ, მოგვიანებით სცადოთ.");
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
      className="rounded-2xl bg-white p-5 shadow-[0_10px_28px_rgba(59,40,27,0.06)] sm:p-7 lg:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f6f3f2] text-[#7f512f]">
          <Mail className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#1b1c1c]">
          მოგვწერეთ
        </h2>
      </div>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">თქვენი ელფოსტა</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={submissionState === "sending"}
            placeholder="name@example.com"
            className="min-h-12 w-full rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] px-4 text-base text-[#1b1c1c] placeholder:text-[#83746b] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">თემა</span>
          <input
            type="text"
            name="subject"
            required
            maxLength={120}
            disabled={submissionState === "sending"}
            placeholder="რის შესახებ გვწერთ?"
            className="min-h-12 w-full rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] px-4 text-base text-[#1b1c1c] placeholder:text-[#83746b] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1b1c1c]">აღწერა</span>
          <textarea
            name="description"
            required
            maxLength={2000}
            rows={6}
            disabled={submissionState === "sending"}
            placeholder="დაგვიწერეთ თქვენი შეკითხვა ან სასურველი პროდუქტის დეტალები."
            className="w-full resize-y rounded-xl border border-[#d6c3b8] bg-[#fcf9f8] px-4 py-3 text-base leading-7 text-[#1b1c1c] placeholder:text-[#83746b] focus:border-[#7f512f] focus:outline-none focus:ring-2 focus:ring-[#7f512f]/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submissionState === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7f512f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#6d4528] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7f512f] disabled:cursor-wait disabled:opacity-65 sm:w-auto"
      >
        {submissionState === "sending" ? (
          <>
            იგზავნება...
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          </>
        ) : (
          <>
            გაგზავნა
            <Send className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-4 max-w-xl text-sm leading-6 text-[#605e5b]">
        წერილი პირდაპირ Home Mix-ის ელფოსტაზე გაიგზავნება. თქვენი ელფოსტა მხოლოდ პასუხისთვის გამოიყენება.
      </p>
      {notice ? (
        <p
          role={submissionState === "error" ? "alert" : "status"}
          className={`mt-3 text-sm font-medium leading-6 ${submissionState === "error" ? "text-[#a33c32]" : "text-[#7f512f]"}`}
        >
          {notice}
        </p>
      ) : null}
    </form>
  );
}
