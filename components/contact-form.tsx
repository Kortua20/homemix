"use client";

import { LoaderCircle, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "sending" | "success" | "error";

type ContactResponse = {
  error?: string;
  remaining?: number;
};

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
      className="rounded-2xl bg-white p-5 shadow-[0_10px_28px_rgba(59,40,27,0.06)] sm:p-7 lg:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e9eee9] text-[#1d4a38]">
          <Mail className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#18221d]">
          მოგვწერეთ
        </h2>
      </div>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#18221d]">
            თქვენი ელფოსტა
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={submissionState === "sending"}
            placeholder="name@example.com"
            className="min-h-12 w-full rounded-xl border border-[#b9c6bd] bg-[#f4f2ed] px-4 text-base text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#18221d]">
            სათაური
          </span>
          <input
            type="text"
            name="subject"
            required
            maxLength={120}
            disabled={submissionState === "sending"}
            placeholder="რის შესახებ გვწერთ?"
            className="min-h-12 w-full rounded-xl border border-[#b9c6bd] bg-[#f4f2ed] px-4 text-base text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#18221d]">
            აღწერა
          </span>
          <textarea
            name="description"
            required
            maxLength={2000}
            rows={6}
            disabled={submissionState === "sending"}
            placeholder="დაწერეთ თქვენი კითხვა ან კომენტარი"
            className="w-full resize-y rounded-xl border border-[#b9c6bd] bg-[#f4f2ed] px-4 py-3 text-base leading-7 text-[#18221d] placeholder:text-[#667168] focus:border-[#1d4a38] focus:outline-none focus:ring-2 focus:ring-[#1d4a38]/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submissionState === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1d4a38] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#15382a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1d4a38] disabled:cursor-wait disabled:opacity-65 sm:w-auto"
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

      <p id="contact-privacy-note" className="mt-4 max-w-xl text-sm leading-6 text-[#5e685f]">
        წერილი პირდაპირ Home Mix-ის ელფოსტაზე გაიგზავნება. თქვენი ელფოსტა მხოლოდ
        პასუხისთვის გამოიყენება.
      </p>
      {notice ? (
        <p
          id="contact-form-notice"
          role={submissionState === "error" ? "alert" : "status"}
          className={`mt-3 text-sm font-medium leading-6 ${submissionState === "error" ? "text-[#a33c32]" : "text-[#1d4a38]"}`}
        >
          {notice}
        </p>
      ) : null}
    </form>
  );
}
