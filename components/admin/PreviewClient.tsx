"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";
import { defaultContent, defaultGlobals } from "@/lib/content/defaults";
import { GlobalSettings, PageContent } from "@/lib/content/types";
import InlineEditor from "@/components/admin/InlineEditor";

export default function PreviewClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [globals, setGlobals] = useState<GlobalSettings>(defaultGlobals);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user?.id) {
        setStatus("Sign in at /admin to preview drafts.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        setStatus("Your account does not have admin access.");
        setLoading(false);
        return;
      }

      const [{ data: pageData }, { data: globalsData }] = await Promise.all([
        supabase.from("pages").select("draft").eq("slug", "home").single(),
        supabase
          .from("global_settings")
          .select("draft")
          .eq("key", "site")
          .single(),
      ]);

      if (!mounted) return;
      if (pageData?.draft) {
        setContent(pageData.draft as PageContent);
      }
      if (globalsData?.draft) {
        setGlobals(globalsData.draft as GlobalSettings);
      }
      setLoading(false);
    };

    loadPreview();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return <div className="min-h-screen bg-stone-50 px-6 py-16">Loading...</div>;
  }

  const saveDraft = async () => {
    setSaving(true);
    const [{ error: pageError }, { error: globalError }] = await Promise.all([
      supabase.from("pages").upsert({
        slug: "home",
        title: content.title,
        draft: content,
        updated_at: new Date().toISOString(),
      }),
      supabase.from("global_settings").upsert({
        key: "site",
        draft: globals,
        updated_at: new Date().toISOString(),
      }),
    ]);
    if (pageError || globalError) {
      setStatus(pageError?.message || globalError?.message || "Unable to save draft.");
    }
    setSaving(false);
  };

  if (status) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-600 shadow-lg">
          {status}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-72 w-72 rounded-full bg-stone-200/70 blur-3xl" />
        <main className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                Draft preview
              </p>
              <h1 className="text-2xl font-semibold text-stone-900">
                {globals.logoText}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold text-stone-700"
                onClick={saveDraft}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save draft"}
              </button>
              <Link
                className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold text-stone-700"
                href="/admin"
              >
                Back to admin
              </Link>
            </div>
          </div>
          <InlineEditor
            content={content}
            globals={globals}
            onChangeContent={setContent}
            onChangeGlobals={setGlobals}
          />
        </main>
      </div>
    </div>
  );
}
