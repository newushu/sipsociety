"use client";

import { useEffect, useMemo, useState } from "react";
import BlockEditor from "@/components/admin/BlockEditor";
import { blockTypes, createBlock } from "@/lib/content/blocks";
import { defaultContent, defaultGlobals } from "@/lib/content/defaults";
import { ContentBlock, GlobalSettings, PageContent } from "@/lib/content/types";
import InlineEditor from "@/components/admin/InlineEditor";
import InlinePreview from "@/components/admin/InlinePreview";
import InlineEditPanel from "@/components/admin/InlineEditPanel";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { createBrowserClient } from "@/lib/supabase/browser";

const formInput =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm";

export default function AdminClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [globals, setGlobals] = useState<GlobalSettings>(defaultGlobals);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState(blockTypes[0].value);
  const [panel, setPanel] = useState<
    "workspace" | "identity" | "inline" | "blocks" | "menu" | "publishing"
  >("workspace");
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(0);
  const [showInlineControls, setShowInlineControls] = useState(false);
  const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const containerClass =
    panel === "inline"
      ? "mx-auto flex w-full flex-col gap-6 px-6 py-10"
      : "mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10";

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      setSessionEmail(session?.user?.email ?? null);
      if (!session?.user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setRole(profile?.role ?? null);
      await Promise.all([loadDraft(), loadGlobals()]);
      setLoading(false);
    };

    const loadDraft = async () => {
      const { data } = await supabase
        .from("pages")
        .select("draft")
        .eq("slug", "home")
        .single();
      if (!mounted) return;
      if (data?.draft) {
        setContent(data.draft as PageContent);
      }
    };

    const loadGlobals = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("draft")
        .eq("key", "site")
        .single();
      if (!mounted) return;
      if (data?.draft) {
        setGlobals(data.draft as GlobalSettings);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignIn = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
    }
  };

  const handleSignUp = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Account created. Ask an admin to upgrade your role.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionEmail(null);
    setRole(null);
  };

  const handleLogoUpload = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      upsert: true,
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    const publicUrl = supabase.storage.from("media").getPublicUrl(fileName).data.publicUrl;
    setGlobals((prev) => ({ ...prev, logoImageUrl: publicUrl }));
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    setContent((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, blockIndex) =>
        blockIndex === index ? updated : block
      ),
    }));
  };

  const removeBlock = (index: number) => {
    setContent((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.blocks.length) return prev;
      const blocks = [...prev.blocks];
      const temp = blocks[index];
      blocks[index] = blocks[nextIndex];
      blocks[nextIndex] = temp;
      return { ...prev, blocks };
    });
  };

  const addBlock = () => {
    setContent((prev) => ({
      ...prev,
      blocks: [...prev.blocks, createBlock(selectedBlock)],
    }));
  };

  const saveDraft = async () => {
    setStatus(null);
    setIsSaving(true);
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
    } else {
      setStatus("Draft saved.");
    }
    setIsSaving(false);
  };

  const updateBrandMessage = (value: string) => {
    setGlobals((prev) => ({ ...prev, brandMessage: value }));
    setContent((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.type === "brand-message"
          ? { ...block, data: { ...block.data, message: value } }
          : block
      ),
    }));
  };

  const publish = async () => {
    setStatus(null);
    setIsPublishing(true);
    const [{ error: pageError }, { error: globalError }] = await Promise.all([
      supabase.from("pages").upsert({
        slug: "home",
        title: content.title,
        draft: content,
        published: content,
        updated_at: new Date().toISOString(),
      }),
      supabase.from("global_settings").upsert({
        key: "site",
        draft: globals,
        published: globals,
        updated_at: new Date().toISOString(),
      }),
    ]);
    if (pageError || globalError) {
      setStatus(
        pageError?.message || globalError?.message || "Unable to publish changes."
      );
    } else {
      setStatus("Published to live site.");
    }
    setIsPublishing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16 text-stone-600">
        Loading...
      </div>
    );
  }

  if (!sessionEmail) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-stone-900">Sip Society Admin</h1>
          <p className="text-sm text-stone-500">
            Sign in to edit and publish content.
          </p>
          <div className="space-y-4">
            <input
              className={formInput}
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
            <input
              className={formInput}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
              onClick={handleSignIn}
            >
              Sign in
            </button>
            <button
              className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-900"
              onClick={handleSignUp}
            >
              Create account
            </button>
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-stone-900">Sip Society Admin</h1>
          <p className="text-sm text-stone-500">
            You are signed in as {sessionEmail}.
          </p>
          <p className="text-sm text-stone-600">
            Your account does not have admin access yet. Update your role in the
            Supabase profiles table to "admin".
          </p>
          <button
            className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-900"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col gap-4 border-r border-stone-200 bg-white px-5 py-8 shadow-sm lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Admin workspace
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Manage site content and publishing.
            </p>
          </div>
          <div className="space-y-3 text-sm text-stone-600">
            <button
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left"
              onClick={() => setPanel("workspace")}
            >
              <p className="font-semibold text-stone-900">Workspace</p>
              <p className="text-xs text-stone-500">Overview and guidance</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("identity")}
            >
              <p className="font-semibold text-stone-900">Site identity</p>
              <p className="text-xs text-stone-500">Logo + motto + title</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("inline")}
            >
              <p className="font-semibold text-stone-900">Inline view - Home</p>
              <p className="text-xs text-stone-500">Preview + edit in context</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("blocks")}
            >
              <p className="font-semibold text-stone-900">Page blocks - Home</p>
              <p className="text-xs text-stone-500">Edit each section</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("menu")}
            >
              <p className="font-semibold text-stone-900">Menu board</p>
              <p className="text-xs text-stone-500">Non-website display edits</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("publishing")}
            >
              <p className="font-semibold text-stone-900">Publishing</p>
              <p className="text-xs text-stone-500">Save draft or go live</p>
            </button>
          </div>
          {panel === "inline" && (
            <InlineEditPanel
              target={inlineEditTarget}
              content={content}
              globals={globals}
              onChangeContent={setContent}
              onChangeGlobals={setGlobals}
              onClear={() => setInlineEditTarget(null)}
            />
          )}
          <div className="mt-auto space-y-3">
            <button
              className="w-full rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button
              className="w-full rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
              onClick={publish}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
            <a
              className="block rounded-full border border-stone-200 px-5 py-2 text-center text-sm font-semibold"
              href="/preview"
              target="_blank"
              rel="noreferrer"
            >
              Open preview
            </a>
            <button
              className="w-full rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className={containerClass}>
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-stone-900">
                  Sip Society Admin
                </h1>
                <p className="text-sm text-stone-500">Signed in as {sessionEmail}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
                  href="/preview"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open preview
                </a>
                <button
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </header>

            <div className="space-y-6">
              {panel === "workspace" && (
                <section className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-stone-600 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                    Admin workspace
                  </p>
                  <p className="mt-4 text-lg font-semibold text-stone-900">
                    This is your editing hub.
                  </p>
                  <p className="mt-3 text-sm text-stone-600">
                    Choose a section from the left menu to edit content. Inline view lets
                    you edit text directly on the layout.
                  </p>
                </section>
              )}

              {panel === "identity" && (
                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Site identity
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo mark
                      <input
                        className={formInput}
                        value={globals.logoMark}
                        onChange={(event) =>
                          setGlobals({ ...globals, logoMark: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo text
                      <input
                        className={formInput}
                        value={globals.logoText}
                        onChange={(event) =>
                          setGlobals({ ...globals, logoText: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo image
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <input
                        className="text-xs text-stone-600"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                      {globals.logoImageUrl && (
                        <img
                          src={globals.logoImageUrl}
                          alt="Logo preview"
                          className="h-12 w-12 rounded-full border border-stone-200 object-cover"
                        />
                      )}
                    </div>
                    <input
                      className={`${formInput} mt-3`}
                      placeholder="Logo image URL (optional)"
                      value={globals.logoImageUrl ?? ""}
                      onChange={(event) =>
                        setGlobals({ ...globals, logoImageUrl: event.target.value })
                      }
                    />
                  </div>
                  <label className="mt-4 block space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Motto
                    <input
                      className={formInput}
                      value={globals.motto}
                      onChange={(event) =>
                        setGlobals({ ...globals, motto: event.target.value })
                      }
                    />
                  </label>
                  <label className="mt-4 block space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Brand message (global)
                    <textarea
                      className={`${formInput} min-h-[90px]`}
                      value={globals.brandMessage ?? ""}
                      onChange={(event) => updateBrandMessage(event.target.value)}
                    />
                  </label>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo text size
                      <input
                        className={formInput}
                        type="number"
                        min={10}
                        max={80}
                        value={globals.logoTextStyle?.size ?? 12}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            logoTextStyle: {
                              size: Number(event.target.value),
                              weight: globals.logoTextStyle?.weight ?? 600,
                              italic: globals.logoTextStyle?.italic ?? false,
                              x: globals.logoTextStyle?.x ?? 0,
                              y: globals.logoTextStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      <select
                        className={formInput}
                        value={globals.logoTextStyle?.weight ?? 600}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            logoTextStyle: {
                              size: globals.logoTextStyle?.size ?? 12,
                              weight: Number(event.target.value),
                              italic: globals.logoTextStyle?.italic ?? false,
                              x: globals.logoTextStyle?.x ?? 0,
                              y: globals.logoTextStyle?.y ?? 0,
                            },
                          })
                        }
                      >
                        {[300, 400, 500, 600, 700].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Motto size
                      <input
                        className={formInput}
                        type="number"
                        min={10}
                        max={80}
                        value={globals.mottoStyle?.size ?? 40}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            mottoStyle: {
                              size: Number(event.target.value),
                              weight: globals.mottoStyle?.weight ?? 600,
                              italic: globals.mottoStyle?.italic ?? false,
                              x: globals.mottoStyle?.x ?? 0,
                              y: globals.mottoStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      <select
                        className={formInput}
                        value={globals.mottoStyle?.weight ?? 600}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            mottoStyle: {
                              size: globals.mottoStyle?.size ?? 40,
                              weight: Number(event.target.value),
                              italic: globals.mottoStyle?.italic ?? false,
                              x: globals.mottoStyle?.x ?? 0,
                              y: globals.mottoStyle?.y ?? 0,
                            },
                          })
                        }
                      >
                        {[300, 400, 500, 600, 700].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Brand msg size
                      <input
                        className={formInput}
                        type="number"
                        min={10}
                        max={80}
                        value={globals.brandMessageStyle?.size ?? 30}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            brandMessageStyle: {
                              size: Number(event.target.value),
                              weight: globals.brandMessageStyle?.weight ?? 600,
                              italic: globals.brandMessageStyle?.italic ?? false,
                              x: globals.brandMessageStyle?.x ?? 0,
                              y: globals.brandMessageStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      <select
                        className={formInput}
                        value={globals.brandMessageStyle?.weight ?? 600}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            brandMessageStyle: {
                              size: globals.brandMessageStyle?.size ?? 30,
                              weight: Number(event.target.value),
                              italic: globals.brandMessageStyle?.italic ?? false,
                              x: globals.brandMessageStyle?.x ?? 0,
                              y: globals.brandMessageStyle?.y ?? 0,
                            },
                          })
                        }
                      >
                        {[300, 400, 500, 600, 700].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-2 grid gap-4 sm:grid-cols-3 text-xs text-stone-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={globals.logoTextStyle?.italic ?? false}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            logoTextStyle: {
                              size: globals.logoTextStyle?.size ?? 12,
                              weight: globals.logoTextStyle?.weight ?? 600,
                              italic: event.target.checked,
                              x: globals.logoTextStyle?.x ?? 0,
                              y: globals.logoTextStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      Logo italic
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={globals.mottoStyle?.italic ?? false}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            mottoStyle: {
                              size: globals.mottoStyle?.size ?? 40,
                              weight: globals.mottoStyle?.weight ?? 600,
                              italic: event.target.checked,
                              x: globals.mottoStyle?.x ?? 0,
                              y: globals.mottoStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      Motto italic
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={globals.brandMessageStyle?.italic ?? false}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            brandMessageStyle: {
                              size: globals.brandMessageStyle?.size ?? 30,
                              weight: globals.brandMessageStyle?.weight ?? 600,
                              italic: event.target.checked,
                              x: globals.brandMessageStyle?.x ?? 0,
                              y: globals.brandMessageStyle?.y ?? 0,
                            },
                          })
                        }
                      />
                      Brand italic
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      <input
                        type="checkbox"
                        checked={globals.borderEnabled ?? true}
                        onChange={(event) =>
                          setGlobals({ ...globals, borderEnabled: event.target.checked })
                        }
                      />
                      Borders on
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Border color
                      <input
                        className="h-10 w-full rounded-xl border border-stone-200 px-3"
                        value={globals.borderColor ?? "#e7e2d9"}
                        onChange={(event) =>
                          setGlobals({ ...globals, borderColor: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Border width
                      <input
                        className={formInput}
                        type="number"
                        min={0}
                        max={10}
                        value={globals.borderWidth ?? 1}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            borderWidth: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-4 block space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Page title
                    <input
                      className={formInput}
                      value={content.title}
                      onChange={(event) =>
                        setContent({ ...content, title: event.target.value })
                      }
                    />
                  </label>
                </section>
              )}

              {panel === "inline" && (
                <section className="space-y-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                    Inline view - Home page
                  </p>
                  <div className="rounded-[48px] border border-stone-200 bg-gradient-to-br from-amber-50 via-white to-stone-100 p-6 shadow-xl shadow-amber-900/10">
                    <InlinePreview
                      content={content}
                      globals={globals}
                      onChangeContent={setContent}
                      onChangeGlobals={setGlobals}
                      activeEdit={inlineEditTarget}
                      onSelectEdit={setInlineEditTarget}
                    />
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
                      <span>Click the overlay buttons on media to replace or adjust.</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                          onClick={() => {
                            setContent(defaultContent);
                            setGlobals(defaultGlobals);
                          }}
                        >
                          Reset to template
                        </button>
                        <button
                          className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                          onClick={() => setShowInlineControls((prev) => !prev)}
                        >
                          {showInlineControls ? "Hide controls" : "Show controls"}
                        </button>
                      </div>
                    </div>
                    {showInlineControls && (
                      <div className="mt-6">
                        <InlineEditor
                          content={content}
                          globals={globals}
                          onChangeContent={setContent}
                          onChangeGlobals={setGlobals}
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {panel === "blocks" && (
                <section className="space-y-6">
                  <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-900">Blocks</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {content.blocks.map((block, index) => (
                        <button
                          key={block.id}
                          className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm"
                          onClick={() => setActiveBlockIndex(index)}
                        >
                          <p className="font-semibold text-stone-900">
                            {index + 1}. {block.type}
                          </p>
                          <p className="text-xs text-stone-500">Click to edit</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeBlockIndex !== null && content.blocks[activeBlockIndex] && (
                    <BlockEditor
                      block={content.blocks[activeBlockIndex]}
                      index={activeBlockIndex}
                      onChange={(updated) => updateBlock(activeBlockIndex, updated)}
                      onRemove={() => removeBlock(activeBlockIndex)}
                      onMove={(direction) => moveBlock(activeBlockIndex, direction)}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white/80 p-5">
                    <select
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm"
                      value={selectedBlock}
                      onChange={(event) =>
                        setSelectedBlock(event.target.value as ContentBlock["type"])
                      }
                    >
                      {blockTypes.map((block) => (
                        <option key={block.value} value={block.value}>
                          {block.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold"
                      onClick={addBlock}
                    >
                      Add block
                    </button>
                  </div>
                </section>
              )}

              {panel === "menu" && (
                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Menu board display
                  </h2>
                  <p className="mt-3 text-sm text-stone-600">
                    The display page uses the Triple Media block. Edit it in Blocks or
                    Inline view, then publish to update the live display.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
                      href="/display"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open display preview
                    </a>
                  </div>
                </section>
              )}

              {panel === "publishing" && (
                <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white/80 p-5">
                  <button
                    className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
                    onClick={saveDraft}
                  >
                    Save draft
                  </button>
                  <button
                    className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
                    onClick={publish}
                  >
                    Publish
                  </button>
                </section>
              )}

              {status && <p className="text-sm text-amber-700">{status}</p>}
            </div>
        </div>
      </div>
    </div>
    </div>
  );
}
