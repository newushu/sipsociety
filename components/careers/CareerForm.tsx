"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";

export type CareerPosition = {
  id: string;
  title: string;
  description?: string | null;
};

type Props = {
  positions: CareerPosition[];
  preview?: boolean;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  submitText?: string;
};

export default function CareerForm({
  positions,
  preview = false,
  containerStyle,
  containerClassName,
  submitText,
}: Props) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [positionId, setPositionId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [fitReason, setFitReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPositions = positions.length > 0;
  const selectedPosition = positions.find((position) => position.id === positionId);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPositionId("");
    setContactEmail("");
    setContactPhone("");
    setResumeLink("");
    setResumeFile(null);
    setResumeFileName(null);
    setFitReason("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) {
      setStatus("Preview mode. Submissions are disabled.");
      return;
    }
    setError(null);
    setStatus(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (hasPositions && !positionId) {
      setError("Please select a position.");
      return;
    }

    if (!resumeLink.trim() && !resumeFile) {
      setError("Please provide a resume link or upload a file.");
      return;
    }

    setIsSubmitting(true);

    let resumePath: string | null = null;

    try {
      if (resumeFile) {
        const extension = resumeFile.name.split(".").pop() || "pdf";
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `applications/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile, { upsert: false });
        if (uploadError) {
          throw uploadError;
        }
        resumePath = filePath;
      }

      const { error: insertError } = await supabase.from("job_applications").insert({
        position_id: positionId || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        resume_link: resumeLink.trim() || null,
        resume_path: resumePath,
        applicant_fit: fitReason.trim() || null,
      });

      if (insertError) {
        throw insertError;
      }

      setStatus("Application submitted. We will be in touch soon.");
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 rounded-3xl border border-stone-200 p-6 shadow-xl backdrop-blur ${containerClassName ?? ""}`}
      style={containerStyle}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base font-semibold text-stone-700">
          First name
          <input
            className={inputClass}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Jordan"
            autoComplete="given-name"
            required
            disabled={preview}
          />
        </label>
        <label className="space-y-2 text-base font-semibold text-stone-700">
          Last name
          <input
            className={inputClass}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Lee"
            autoComplete="family-name"
            required
            disabled={preview}
          />
        </label>
      </div>

      <label className="space-y-2 text-base font-semibold text-stone-700">
        Position
        <select
          className={inputClass}
          value={positionId}
          onChange={(event) => setPositionId(event.target.value)}
          disabled={preview || !hasPositions}
          required={hasPositions}
          aria-disabled={preview || !hasPositions}
        >
          <option value="">Select a role</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.title}
            </option>
          ))}
        </select>
      </label>
      {selectedPosition?.description ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {selectedPosition.description}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base font-semibold text-stone-700">
          Email
          <input
            className={inputClass}
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="jordan@sipsociety.com"
            type="email"
            autoComplete="email"
            disabled={preview}
          />
        </label>
        <label className="space-y-2 text-base font-semibold text-stone-700">
          Phone
          <input
            className={inputClass}
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="(555) 555-5555"
            type="tel"
            autoComplete="tel"
            disabled={preview}
          />
        </label>
      </div>

      <label className="space-y-2 text-base font-semibold text-stone-700">
        Resume link
        <input
          className={inputClass}
          value={resumeLink}
          onChange={(event) => setResumeLink(event.target.value)}
          placeholder="https://"
          type="url"
          disabled={preview}
        />
      </label>

      <div className="space-y-2">
        <p className="text-base font-semibold text-stone-700">
          Upload resume (PDF or DOC)
        </p>
        <input
          className="hidden"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setResumeFile(file);
            setResumeFileName(file ? file.name : null);
          }}
          id="resume-upload"
          disabled={preview}
        />
        <label
          htmlFor="resume-upload"
          className={`inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-base font-semibold shadow-sm transition ${
            preview
              ? "cursor-not-allowed bg-stone-100 text-stone-400"
              : "bg-amber-100 text-amber-900 hover:bg-amber-200"
          }`}
        >
          Choose file
        </label>
        {resumeFileName ? (
          <p className="text-sm text-stone-500">{resumeFileName}</p>
        ) : (
          <p className="text-sm text-stone-400">No file selected.</p>
        )}
      </div>

      <label className="space-y-2 text-base font-semibold text-stone-700">
        What makes you a good fit for this role?
        <textarea
          className={inputClass}
          rows={4}
          value={fitReason}
          onChange={(event) => setFitReason(event.target.value)}
          placeholder="Share your experience, strengths, and why you're excited."
          disabled={preview}
        />
      </label>

      {error && <p className="text-base text-rose-600">{error}</p>}
      {status && <p className="text-base text-emerald-700">{status}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full rounded-full px-6 py-4 text-base font-semibold shadow-lg transition ${
          preview
            ? "cursor-not-allowed bg-stone-300 text-stone-600"
            : "bg-stone-900 text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        }`}
      >
        {preview
          ? "Preview mode"
          : isSubmitting
            ? "Submitting..."
            : submitText ?? "Apply for this role"}
      </button>
    </form>
  );
}
