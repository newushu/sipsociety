"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BlockEditor from "@/components/admin/BlockEditor";
import { blockTypes, createBlock } from "@/lib/content/blocks";
import { defaultContent, defaultGlobals, defaultMenuContent } from "@/lib/content/defaults";
import { ContentBlock, FontKey, GlobalSettings, PageContent } from "@/lib/content/types";
import InlineEditor from "@/components/admin/InlineEditor";
import InlinePreview from "@/components/admin/InlinePreview";
import InlineEditPanel from "@/components/admin/InlineEditPanel";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { createBrowserClient } from "@/lib/supabase/browser";
import HomePageShell from "@/components/HomePageShell";
import IntroOverlay from "@/components/IntroOverlay";
import { fontFamilyForKey, fontOptions, sortFontOptions } from "@/lib/content/fonts";

const formInput =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm";

export default function AdminClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash.includes("type=recovery");
  });
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [globals, setGlobals] = useState<GlobalSettings>(defaultGlobals);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState(blockTypes[0].value);
  const [panel, setPanel] = useState<
    | "workspace"
    | "identity"
    | "inline"
    | "intro"
    | "blocks"
    | "menu"
    | "media"
    | "publishing"
  >("workspace");
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(0);
  const [showInlineControls, setShowInlineControls] = useState(false);
  const [showInlineChips, setShowInlineChips] = useState(true);
  const [showChipsToggle, setShowChipsToggle] = useState(true);
  const [dragMenuId, setDragMenuId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 298;
    const stored = window.localStorage.getItem("adminSidebarWidth");
    if (!stored) return 298;
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? 298 : parsed;
  });
  const sidebarDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const hideChipsToggleRef = useRef<number | null>(null);
  const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activePageSlug, setActivePageSlug] = useState<"home" | "menu">("home");
  const [introPreviewKey, setIntroPreviewKey] = useState(0);
  const [mediaAssets, setMediaAssets] = useState<
    { name: string; url: string; createdAt?: string | null }[]
  >([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "15m" | "1h" | "1d" | "1w">("all");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const usedFonts = useMemo(() => {
    const used = new Set<FontKey>();
    if (globals.bodyFont) used.add(globals.bodyFont);
    if (globals.mottoFont) used.add(globals.mottoFont);
    if (globals.brandHeadingFont) used.add(globals.brandHeadingFont);
    if (globals.brandMessageFont) used.add(globals.brandMessageFont);
    if (globals.logoTextStyle?.font) used.add(globals.logoTextStyle.font);
    if (globals.mottoStyle?.font) used.add(globals.mottoStyle.font);
    if (globals.brandMessageStyle?.font) used.add(globals.brandMessageStyle.font);
    if (globals.menuButtonFont) used.add(globals.menuButtonFont);
    if (globals.menuItemFont) used.add(globals.menuItemFont);
    content.blocks.forEach((block) => {
      if (block.type === "hero" && block.data.taglineStyle?.font) {
        used.add(block.data.taglineStyle.font);
      }
      if (block.type === "brand-message") {
        if (block.data.headingStyle?.font) used.add(block.data.headingStyle.font);
        if (block.data.messageStyle?.font) used.add(block.data.messageStyle.font);
      }
      if (block.type === "triple-media") {
        if (block.data.leftTitleStyle?.font) used.add(block.data.leftTitleStyle.font);
        if (block.data.leftBodyStyle?.font) used.add(block.data.leftBodyStyle.font);
      }
      if (block.type === "landscape" && block.data.captionStyle?.font) {
        used.add(block.data.captionStyle.font);
      }
      if (block.type === "footer" && block.data.taglineStyle?.font) {
        used.add(block.data.taglineStyle.font);
      }
    });
    return used;
  }, [content.blocks, globals]);
  const sortedFontOptions = useMemo(
    () => sortFontOptions(fontOptions, usedFonts),
    [usedFonts]
  );

  const pageOptions = [
    { slug: "home", label: "Home" },
    { slug: "menu", label: "Menu" },
  ] as const;

  const defaultContentForSlug = (slug: "home" | "menu") =>
    slug === "menu" ? defaultMenuContent : defaultContent;

  const introPalette = [
    "#0c0a09",
    "#1c1917",
    "#111827",
    "#0f172a",
    "#7c2d12",
    "#78350f",
    "#a16207",
    "#f59e0b",
    "#fde68a",
    "#f5f5f4",
  ];

  const handleIntroDone = useCallback(() => {
    setIntroPreviewKey(0);
  }, []);

  const isMediaInRange = useCallback(
    (asset: { createdAt?: string | null }, filter: typeof mediaFilter) => {
      if (filter === "all") return true;
      const stamp = asset.createdAt;
      if (!stamp) return false;
      const date = new Date(stamp);
      if (Number.isNaN(date.getTime())) return false;
      const minutes = (Date.now() - date.getTime()) / 60000;
      if (minutes < 0) return false;
      if (filter === "15m") return minutes <= 15;
      if (filter === "1h") return minutes <= 60;
      if (filter === "1d") return minutes <= 60 * 24;
      if (filter === "1w") return minutes <= 60 * 24 * 7;
      return true;
    },
    [mediaFilter]
  );

  const loadMediaLibrary = useCallback(async () => {
    setMediaLoading(true);
    setMediaError(null);
    const { data, error } = await supabase.storage.from("media").list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setMediaError(error.message);
      setMediaLoading(false);
      return;
    }
    const items =
      data?.map((item) => ({
        name: item.name,
        url: supabase.storage.from("media").getPublicUrl(item.name).data.publicUrl,
        createdAt: item.created_at ?? null,
      })) ?? [];
    setMediaAssets(items);
    setMediaLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (panel !== "media") return;
    const timer = window.setTimeout(() => {
      void loadMediaLibrary();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [panel, loadMediaLibrary]);

  const containerClass =
    panel === "inline"
      ? "mx-auto flex w-full max-w-none flex-col gap-6 px-0 py-10"
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
      await Promise.all([loadDraft(activePageSlug), loadGlobals()]);
      setLoading(false);
    };

    const loadDraft = async (slug: "home" | "menu") => {
      const { data } = await supabase
        .from("pages")
        .select("draft")
        .eq("slug", slug)
        .single();
      if (!mounted) return;
      setContent((data?.draft as PageContent) ?? defaultContentForSlug(slug));
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
  }, [supabase, activePageSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminSidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!sidebarDragRef.current) return;
      const next = sidebarDragRef.current.startWidth + (event.clientX - sidebarDragRef.current.startX);
      setSidebarWidth(Math.min(420, Math.max(240, next)));
    };
    const handleUp = () => {
      sidebarDragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useEffect(() => {
    if (panel !== "inline") return;
    const showTemporarily = () => {
      setShowChipsToggle(true);
      if (hideChipsToggleRef.current) {
        window.clearTimeout(hideChipsToggleRef.current);
      }
      hideChipsToggleRef.current = window.setTimeout(() => {
        setShowChipsToggle(false);
      }, 5000);
    };
    const handleMove = (event: MouseEvent) => {
      if (event.clientY < 80) showTemporarily();
    };
    const handleScroll = () => showTemporarily();
    showTemporarily();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("scroll", handleScroll, true);
      if (hideChipsToggleRef.current) {
        window.clearTimeout(hideChipsToggleRef.current);
        hideChipsToggleRef.current = null;
      }
    };
  }, [panel]);

  useEffect(() => {
    if (!sessionEmail) return;
    const resetTimer = window.setTimeout(() => {
      setStatus(null);
      setInlineEditTarget(null);
      setActiveBlockIndex(0);
    }, 0);
    const fetchPage = async () => {
      const { data } = await supabase
        .from("pages")
        .select("draft")
        .eq("slug", activePageSlug)
        .single();
      setContent((data?.draft as PageContent) ?? defaultContentForSlug(activePageSlug));
    };
    fetchPage();
    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [activePageSlug, sessionEmail, supabase]);

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

  const handleResetPassword = async () => {
    setStatus(null);
    if (!email) {
      setStatus("Enter your email to receive a reset link.");
      return;
    }
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Password reset email sent.");
    }
  };

  const handleUpdatePassword = async () => {
    setStatus(null);
    if (!newPassword || newPassword.length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Password updated. You can sign in now.");
    setNewPassword("");
    setConfirmPassword("");
    setIsRecovery(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
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
        slug: activePageSlug,
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

  const autosaveRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading || !role) return;
    if (isSaving || isPublishing) return;
    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current);
    }
    autosaveRef.current = window.setTimeout(() => {
      saveDraft();
    }, 8000);
    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current);
      }
    };
  }, [content, globals, activePageSlug, loading, role, isSaving, isPublishing]);

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
        slug: activePageSlug,
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
    if (isRecovery) {
      return (
        <div className="min-h-screen bg-stone-50 px-6 py-16">
          <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
            <h1 className="text-2xl font-semibold text-stone-900">Reset password</h1>
            <p className="text-sm text-stone-500">
              Set a new password for your account.
            </p>
            <div className="space-y-4">
              <input
                className={formInput}
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
              />
              <input
                className={formInput}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
                onClick={handleUpdatePassword}
              >
                Update password
              </button>
              <button
                className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-900"
                onClick={() => {
                  setIsRecovery(false);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", window.location.pathname);
                  }
                }}
              >
                Back to sign in
              </button>
            </div>
            {status && <p className="text-sm text-amber-700">{status}</p>}
          </div>
        </div>
      );
    }

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
            <button
              className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-900"
              onClick={handleResetPassword}
            >
              Reset password
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
            Supabase profiles table to &quot;admin&quot;.
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
    <>
      {introPreviewKey > 0 && (
          <IntroOverlay
            logoText={globals.logoText}
            motto={globals.motto}
            logoTextStyle={{
              fontSize: `${globals.logoTextStyle?.size ?? 12}px`,
              fontWeight: globals.logoTextStyle?.weight ?? 600,
              fontStyle: globals.logoTextStyle?.italic ? "italic" : "normal",
              transform: `translate(${globals.logoTextStyle?.x ?? 0}px, ${globals.logoTextStyle?.y ?? 0}px)`,
              fontFamily: fontFamilyForKey(globals.bodyFont),
            }}
            mottoStyle={{
              fontSize: `${globals.mottoStyle?.size ?? 40}px`,
              fontWeight: globals.mottoStyle?.weight ?? 600,
              fontStyle: globals.mottoStyle?.italic ? "italic" : "normal",
              transform: `translate(${globals.mottoStyle?.x ?? 0}px, ${globals.mottoStyle?.y ?? 0}px)`,
              fontFamily: fontFamilyForKey(globals.mottoFont),
            }}
          showLogoText={globals.showLogoText}
          enabled
          bgFrom={globals.introBgFrom}
          bgVia={globals.introBgVia}
          bgTo={globals.introBgTo}
          textColor={globals.introTextColor}
          wipeColor={globals.introWipeColor}
          holdMs={globals.introHoldMs}
          wipeMs={globals.introWipeMs}
          fadeMs={globals.introFadeMs}
          playId={introPreviewKey}
          onDone={handleIntroDone}
        />
      )}
      <div className="min-h-screen bg-stone-50 text-stone-800">
        <div className="flex min-h-screen">
          {showSidebar ? (
            <aside
              className="sticky top-0 z-30 hidden h-screen flex-col gap-4 overflow-y-auto border-r border-stone-200 bg-white px-5 py-8 shadow-sm lg:flex"
              style={{ width: `${sidebarWidth}px` }}
            >
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
              <p className="font-semibold text-stone-900">Edit Page Inline</p>
              <p className="text-xs text-stone-500">Preview + edit in context</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("media")}
            >
              <p className="font-semibold text-stone-900">Media library</p>
              <p className="text-xs text-stone-500">Manage images + videos</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("blocks")}
            >
              <p className="font-semibold text-stone-900">Page blocks</p>
              <p className="text-xs text-stone-500">Edit each section</p>
            </button>
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("intro")}
            >
              <p className="font-semibold text-stone-900">Intro animation</p>
              <p className="text-xs text-stone-500">Palette + timing controls</p>
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
          <div
            className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
            onPointerDown={(event) => {
              sidebarDragRef.current = { startX: event.clientX, startWidth: sidebarWidth };
            }}
          />
        </aside>
          ) : null}

        <div className="flex-1">
          <div className={containerClass}>
            {panel === "inline" ? (
              <div
                className={`fixed top-4 z-50 transition-opacity ${
                  showChipsToggle ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                style={{ left: showSidebar ? sidebarWidth + 16 : 16 }}
                onMouseEnter={() => setShowChipsToggle(true)}
                onMouseLeave={() => setShowChipsToggle(false)}
              >
                <div className="flex items-center gap-2">
                  {!showSidebar ? (
                    <button
                      className="rounded-full border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                      onClick={() => setShowSidebar(true)}
                    >
                      Show sidebar
                    </button>
                  ) : null}
                  {showSidebar ? (
                    <button
                      className="rounded-full border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                      onClick={() => setShowSidebar(false)}
                    >
                      Hide sidebar
                    </button>
                  ) : null}
                  <button
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm"
                    onClick={() => setShowInlineChips((prev) => !prev)}
                  >
                    {showInlineChips ? "Hide chips" : "Show chips"}
                  </button>
                </div>
              </div>
            ) : null}
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
                  {(() => {
                    const menuItems = globals.menuItems ?? defaultGlobals.menuItems ?? [];
                    const updateMenuItems = (items: typeof menuItems) =>
                      setGlobals({ ...globals, menuItems: items });
                    const moveMenuItem = (fromId: string, toId: string) => {
                      if (fromId === toId) return;
                      const fromIndex = menuItems.findIndex((item) => item.id === fromId);
                      const toIndex = menuItems.findIndex((item) => item.id === toId);
                      if (fromIndex === -1 || toIndex === -1) return;
                      const next = [...menuItems];
                      const [moved] = next.splice(fromIndex, 1);
                      next.splice(toIndex, 0, moved);
                      updateMenuItems(next);
                    };
                    return (
                      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Navigation menu
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Button text
                            <input
                              className={formInput}
                              value={globals.menuButtonText ?? "MENU"}
                              onChange={(event) =>
                                setGlobals({ ...globals, menuButtonText: event.target.value })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Button text size
                            <input
                              className={formInput}
                              type="number"
                              min={8}
                              max={24}
                              value={globals.menuButtonTextSize ?? 11}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuButtonTextSize: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Button font
                            <select
                              className={formInput}
                              value={globals.menuButtonFont ?? ""}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuButtonFont: event.target.value as GlobalSettings["bodyFont"],
                                })
                              }
                            >
                              {sortedFontOptions.map((font) => (
                                <option key={font.value} value={font.value}>
                                  {font.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Button colors
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className={formInput}
                                type="color"
                                value={globals.menuButtonTextColor ?? "#1c1917"}
                                onChange={(event) =>
                                  setGlobals({
                                    ...globals,
                                    menuButtonTextColor: event.target.value,
                                  })
                                }
                              />
                              <input
                                className={formInput}
                                type="color"
                                value={globals.menuButtonBorderColor ?? "#d6d3d1"}
                                onChange={(event) =>
                                  setGlobals({
                                    ...globals,
                                    menuButtonBorderColor: event.target.value,
                                  })
                                }
                              />
                              <input
                                className={formInput}
                                type="text"
                                placeholder="Button background rgba(...)"
                                value={globals.menuButtonBg ?? "rgba(255,255,255,0.25)"}
                                onChange={(event) =>
                                  setGlobals({
                                    ...globals,
                                    menuButtonBg: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Menu item font
                            <select
                              className={formInput}
                              value={globals.menuItemFont ?? ""}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuItemFont: event.target.value as GlobalSettings["bodyFont"],
                                })
                              }
                            >
                              {sortedFontOptions.map((font) => (
                                <option key={font.value} value={font.value}>
                                  {font.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Menu item size
                            <input
                              className={formInput}
                              type="number"
                              min={12}
                              max={36}
                              value={globals.menuItemSize ?? 18}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuItemSize: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Menu item color
                            <input
                              className={formInput}
                              type="color"
                              value={globals.menuItemColor ?? "#1c1917"}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuItemColor: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Panel background
                            <input
                              className={formInput}
                              type="color"
                              value={globals.menuPanelBg ?? "#ffffff"}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuPanelBg: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Menu panel width (%)
                            <input
                              className={formInput}
                              type="number"
                              min={15}
                              max={50}
                              value={globals.menuPanelWidthPct ?? 25}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  menuPanelWidthPct: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Menu items (drag to reorder)
                          </p>
                          <div className="mt-3 space-y-2">
                            {menuItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                                draggable
                                onDragStart={() => setDragMenuId(item.id)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                  if (dragMenuId) moveMenuItem(dragMenuId, item.id);
                                  setDragMenuId(null);
                                }}
                              >
                                <span className="cursor-grab text-stone-400">⋮⋮</span>
                                <input
                                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-xs"
                                  value={item.label}
                                  onChange={(event) =>
                                    updateMenuItems(
                                      menuItems.map((current) =>
                                        current.id === item.id
                                          ? { ...current, label: event.target.value }
                                          : current
                                      )
                                    )
                                  }
                                />
                                <input
                                  className="flex-[2] rounded-lg border border-stone-200 px-3 py-2 text-xs"
                                  value={item.href}
                                  onChange={(event) =>
                                    updateMenuItems(
                                      menuItems.map((current) =>
                                        current.id === item.id
                                          ? { ...current, href: event.target.value }
                                          : current
                                      )
                                    )
                                  }
                                />
                                <button
                                  className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600"
                                  onClick={() =>
                                    updateMenuItems(
                                      menuItems.filter((current) => current.id !== item.id)
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            className="mt-3 rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                            onClick={() =>
                              updateMenuItems([
                                ...menuItems,
                                {
                                  id: `nav-${Date.now()}`,
                                  label: "New item",
                                  href: "#",
                                },
                              ])
                            }
                          >
                            Add item
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Body font
                      <select
                        className={formInput}
                        value={globals.bodyFont ?? "sans"}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            bodyFont: event.target.value as typeof globals.bodyFont,
                          })
                        }
                      >
                        {sortedFontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Motto font
                      <select
                        className={formInput}
                        value={globals.mottoFont ?? "display"}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            mottoFont: event.target.value as typeof globals.mottoFont,
                          })
                        }
                      >
                        {sortedFontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Brand heading font
                      <select
                        className={formInput}
                        value={globals.brandHeadingFont ?? "sans"}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            brandHeadingFont: event.target.value as typeof globals.brandHeadingFont,
                          })
                        }
                      >
                        {sortedFontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Brand message font
                      <select
                        className={formInput}
                        value={globals.brandMessageFont ?? "display"}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            brandMessageFont: event.target.value as typeof globals.brandMessageFont,
                          })
                        }
                      >
                        {sortedFontOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
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

              {panel === "intro" && (
                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Intro animation
                    </h2>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                      onClick={() => setIntroPreviewKey((prev) => prev + 1)}
                    >
                      Play intro
                    </button>
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    <input
                      type="checkbox"
                      checked={globals.introEnabled ?? true}
                      onChange={(event) =>
                        setGlobals({ ...globals, introEnabled: event.target.checked })
                      }
                    />
                    Intro enabled
                  </label>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Background gradient
                      </p>
                      {[
                        { label: "From", key: "introBgFrom" as const },
                        { label: "Via", key: "introBgVia" as const },
                        { label: "To", key: "introBgTo" as const },
                      ].map((row) => (
                        <div key={row.key} className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold text-stone-500">
                            {row.label}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {introPalette.map((color) => (
                              <button
                                key={`${row.key}-${color}`}
                                className={`h-6 w-6 rounded-full border ${
                                  (globals[row.key] ?? "") === color
                                    ? "border-stone-900 ring-2 ring-stone-900/40"
                                    : "border-stone-200"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  setGlobals({
                                    ...globals,
                                    [row.key]: color,
                                  })
                                }
                                aria-label={`${row.label} color`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Text + wipe colors
                      </p>
                      {[
                        { label: "Text", key: "introTextColor" as const },
                        { label: "Wipe", key: "introWipeColor" as const },
                      ].map((row) => (
                        <div key={row.key} className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold text-stone-500">
                            {row.label}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {introPalette.map((color) => (
                              <button
                                key={`${row.key}-${color}`}
                                className={`h-6 w-6 rounded-full border ${
                                  (globals[row.key] ?? "") === color
                                    ? "border-stone-900 ring-2 ring-stone-900/40"
                                    : "border-stone-200"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  setGlobals({
                                    ...globals,
                                    [row.key]: color,
                                  })
                                }
                                aria-label={`${row.label} color`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Hold (ms)
                      <input
                        className={formInput}
                        type="number"
                        min={300}
                        max={8000}
                        value={globals.introHoldMs ?? 1400}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introHoldMs: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Wipe (ms)
                      <input
                        className={formInput}
                        type="number"
                        min={300}
                        max={8000}
                        value={globals.introWipeMs ?? 700}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introWipeMs: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Fade (ms)
                      <input
                        className={formInput}
                        type="number"
                        min={300}
                        max={8000}
                        value={globals.introFadeMs ?? 700}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introFadeMs: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                </section>
              )}

              {panel === "inline" && (
                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                        Edit Page
                      </p>
                      <select
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm"
                        value={activePageSlug}
                        onChange={(event) =>
                          setActivePageSlug(event.target.value as "home" | "menu")
                        }
                      >
                        {pageOptions.map((page) => (
                          <option key={page.slug} value={page.slug}>
                            {page.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {previewMode === "desktop" ? (
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        <button
                          className="rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-white"
                          onClick={() => setPreviewMode("desktop")}
                        >
                          Desktop
                        </button>
                        <button
                          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700"
                          onClick={() => setPreviewMode("mobile")}
                        >
                          Mobile
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="relative">
                    {previewMode === "mobile" ? (
                      <div
                        data-inline-scroll
                        className="mx-auto my-6 h-[844px] w-[390px] overflow-y-auto rounded-[36px] border border-stone-200 bg-white/90 shadow-2xl"
                      >
                        <HomePageShell
                          globals={globals}
                          links={
                            globals.menuItems?.length
                              ? globals.menuItems.map((item) => ({
                                  href: item.href,
                                  label: item.label,
                                }))
                              : [
                                  { href: "/", label: "Home" },
                                  { href: "/menu", label: "Menu" },
                                ]
                          }
                        >
                          <InlinePreview
                            content={content}
                            globals={globals}
                            onChangeContent={setContent}
                            onChangeGlobals={setGlobals}
                            activeEdit={inlineEditTarget}
                            onSelectEdit={setInlineEditTarget}
                            mode={previewMode}
                            layout="frame"
                            showChips={showInlineChips}
                          />
                        </HomePageShell>
                      </div>
                    ) : (
                      <div className="my-6 w-full overflow-auto">
                        <div className="min-w-[1600px]">
                          <HomePageShell
                            globals={globals}
                            links={
                              globals.menuItems?.length
                                ? globals.menuItems.map((item) => ({
                                    href: item.href,
                                    label: item.label,
                                  }))
                                : activePageSlug === "menu"
                                  ? [
                                      { href: "/", label: "Home" },
                                      { href: "/menu", label: "Menu" },
                                    ]
                                  : [
                                      { href: "#brand", label: "Brand" },
                                      { href: "#media", label: "Media" },
                                      { href: "#landscape", label: "Atmosphere" },
                                      { href: "/menu", label: "Menu" },
                                    ]
                            }
                          >
                            <InlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContent}
                              onChangeGlobals={setGlobals}
                              activeEdit={inlineEditTarget}
                              onSelectEdit={setInlineEditTarget}
                              mode={previewMode}
                              layout="viewport"
                              showChips={showInlineChips}
                            />
                          </HomePageShell>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mx-6 rounded-[48px] border border-stone-200 bg-white/80 p-6 shadow-xl shadow-amber-900/10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
                      <span>Click the overlay buttons on media to replace or adjust.</span>
                      <div className="flex flex-wrap gap-2">
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

              {panel === "media" && (
                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Media library
                    </h2>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                      onClick={loadMediaLibrary}
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="mt-4">
                    <input
                      className={formInput}
                      placeholder="Search media..."
                      value={mediaSearch}
                      onChange={(event) => setMediaSearch(event.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["all", "All"],
                      ["15m", "Last 15m"],
                      ["1h", "Last hour"],
                      ["1d", "Last day"],
                      ["1w", "Last week"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          mediaFilter === value
                            ? "border-amber-300 bg-amber-200 text-stone-900"
                            : "border-stone-200 text-stone-500"
                        }`}
                        onClick={() => setMediaFilter(value as typeof mediaFilter)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {mediaLoading ? (
                    <p className="mt-4 text-sm text-stone-500">Loading media...</p>
                  ) : mediaError ? (
                    <p className="mt-4 text-sm text-red-500">{mediaError}</p>
                  ) : (
                    <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {mediaAssets
                          .filter((asset) => {
                            const query = mediaSearch.trim().toLowerCase();
                            const matchesSearch =
                              !query ||
                              asset.name.toLowerCase().includes(query) ||
                              asset.url.toLowerCase().includes(query);
                            return matchesSearch && isMediaInRange(asset, mediaFilter);
                          })
                          .map((asset) => {
                            const isVideo = /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(
                              asset.url
                            );
                            return (
                              <div
                                key={asset.url}
                                className="rounded-2xl border border-stone-200 bg-white p-3"
                              >
                                <div className="h-28 w-full overflow-hidden rounded-xl bg-stone-100">
                                  {isVideo ? (
                                    <video
                                      className="h-full w-full object-cover"
                                      src={asset.url}
                                      muted
                                    />
                                  ) : (
                                    <img
                                      className="h-full w-full object-cover"
                                      src={asset.url}
                                      alt=""
                                    />
                                  )}
                                </div>
                                <p className="mt-2 text-xs text-stone-600">{asset.name}</p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {panel === "blocks" && (
                <section className="space-y-6">
                  <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-900">Blocks</p>
                      <button
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm"
                        onClick={saveDraft}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
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
    </>
  );
}
