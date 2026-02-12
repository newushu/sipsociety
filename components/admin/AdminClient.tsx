"use client";
/* eslint-disable react-hooks/immutability */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BlockEditor from "@/components/admin/BlockEditor";
import { blockTypes, createBlock } from "@/lib/content/blocks";
import {
  defaultAboutContent,
  defaultCareerContent,
  defaultContactContent,
  defaultContent,
  defaultGlobals,
  defaultGalleryContent,
  defaultMenuContent,
} from "@/lib/content/defaults";
import {
  AdminNoteCategory,
  AboutContent,
  ContactContent,
  ContentBlock,
  FontKey,
  GalleryContent,
  GlobalSettings,
  PageContent,
} from "@/lib/content/types";
import InlineEditor from "@/components/admin/InlineEditor";
import InlinePreview from "@/components/admin/InlinePreview";
import InlineEditPanel from "@/components/admin/InlineEditPanel";
import CareerInlinePreview from "@/components/admin/CareerInlinePreview";
import AboutInlinePreview from "@/components/admin/AboutInlinePreview";
import ContactInlinePreview from "@/components/admin/ContactInlinePreview";
import MenuInlinePreview from "@/components/admin/MenuInlinePreview";
import GalleryInlinePreview from "@/components/admin/GalleryInlinePreview";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { createBrowserClient } from "@/lib/supabase/browser";
import HomePageShell from "@/components/HomePageShell";
import IntroOverlay from "@/components/IntroOverlay";
import { sanitizeRichHtml } from "@/lib/content/rich";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { fontFamilyForKey, fontOptions, sortFontOptions } from "@/lib/content/fonts";
import BlockRenderer from "@/components/blocks/BlockRenderer";

const formInput =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm";

type HistorySource = "auto" | "draft" | "publish";
const AUTOSAVE_INTERVAL_MS = 15 * 1000;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const isAbortError = (error: unknown) => {
  if (!error) return false;
  if (typeof error !== "object") return false;
  if ("name" in error && typeof (error as { name?: unknown }).name === "string") {
    return (error as { name: string }).name === "AbortError";
  }
  return false;
};

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
    | "history"
  >("workspace");
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(0);
  const [showInlineControls, setShowInlineControls] = useState(false);
  const [showInlineChips, setShowInlineChips] = useState(true);
  const [showChipsToggle, setShowChipsToggle] = useState(true);
  const [dragMenuId, setDragMenuId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [floatingPanelPos, setFloatingPanelPos] = useState({ x: 24, y: 96 });
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [draftConfirmChecked, setDraftConfirmChecked] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 420;
    const stored = window.localStorage.getItem("adminSidebarWidth");
    if (!stored) return 420;
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? 420 : parsed;
  });
  const sidebarDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const floatingPanelRef = useRef<HTMLDivElement | null>(null);
  const floatingPanelDragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const hideChipsToggleRef = useRef<number | null>(null);
  const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
  const handleInlineSelect = useCallback(
    (target: InlineEditTarget) => {
      setInlineEditTarget(target);
      if (panel !== "inline") setPanel("inline");
      if (!showSidebar) setShowSidebar(true);
    },
    [panel, showSidebar]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activePageSlug, setActivePageSlug] = useState<string>("home");
  const inlinePanelStorageKey = useMemo(
    () => `adminInlinePanelPos:${activePageSlug}`,
    [activePageSlug]
  );
  const [urlDraft, setUrlDraft] = useState("/home");
  const [introPreviewKey, setIntroPreviewKey] = useState(0);
  const [introStaticPreview, setIntroStaticPreview] = useState(true);
  const [introRevealMs, setIntroRevealMs] = useState(2000);
  const [introDetailsOpen, setIntroDetailsOpen] = useState({
    text: true,
    basics: true,
    logo: true,
    colors: true,
    timing: true,
  });
  const [mediaAssets, setMediaAssets] = useState<
    { name: string; url: string; createdAt?: string | null }[]
  >([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "15m" | "1h" | "1d" | "1w">("all");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pageHistory, setPageHistory] = useState<
    {
      id: string;
      slug: string;
      draft: PageContent;
      created_at: string;
      source: HistorySource;
    }[]
  >([]);
  const [globalHistory, setGlobalHistory] = useState<
    {
      id: string;
      key: string;
      draft: GlobalSettings;
      created_at: string;
      source: HistorySource;
    }[]
  >([]);
  const [currentPublishedPage, setCurrentPublishedPage] = useState<PageContent | null>(null);
  const [currentPublishedGlobals, setCurrentPublishedGlobals] =
    useState<GlobalSettings | null>(null);
  const [publishedPageMatchId, setPublishedPageMatchId] = useState<string | null>(null);
  const [publishedGlobalsMatchId, setPublishedGlobalsMatchId] = useState<string | null>(null);
  const historyBackfillRef = useRef<{ page: boolean; globals: boolean }>({
    page: false,
    globals: false,
  });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteCategory, setNoteCategory] = useState<AdminNoteCategory | "">("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [visibleNewNotes, setVisibleNewNotes] = useState(5);
  const [visibleCompletedNotes, setVisibleCompletedNotes] = useState(5);
  const menuHrefEditRef = useRef<Record<string, string>>({});
  const prevMenuItemsRef = useRef<GlobalSettings["menuItems"]>(undefined);
  const autoCleanupDoneRef = useRef(false);
  const usedFonts = useMemo(() => {
    const used = new Set<FontKey>();
    if (globals.bodyFont) used.add(globals.bodyFont);
    if (globals.mottoFont) used.add(globals.mottoFont);
    if (globals.brandHeadingFont) used.add(globals.brandHeadingFont);
    if (globals.logoTextStyle?.font) used.add(globals.logoTextStyle.font);
    if (globals.mottoStyle?.font) used.add(globals.mottoStyle.font);
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
  const floatingPanelLabel = useMemo(() => {
    if (!inlineEditTarget) return "Inline edit";
    const scope = inlineEditTarget.scope.replace(/([A-Z])/g, " $1");
    const prettyScope = scope.charAt(0).toUpperCase() + scope.slice(1);
    const kind = inlineEditTarget.kind.charAt(0).toUpperCase() + inlineEditTarget.kind.slice(1);
    return `${kind}: ${prettyScope}`;
  }, [inlineEditTarget]);
  const sortedFontOptions = useMemo(
    () => sortFontOptions(fontOptions, usedFonts),
    [usedFonts]
  );
  const careerPreviewPositions = useMemo(
    () => [
      { id: "preview-1", title: "Barista" },
      { id: "preview-2", title: "Cafe Lead" },
      { id: "preview-3", title: "Events + Catering" },
    ],
    []
  );
  const adminNotes = useMemo(() => {
    const notes = globals.adminNotes ?? [];
    return [...notes].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [globals.adminNotes]);

  const [pageSlugs, setPageSlugs] = useState<string[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [localDraftAvailable, setLocalDraftAvailable] = useState(false);
  const [localDraftSlug, setLocalDraftSlug] = useState<string | null>(null);
  const handleAsyncError = useCallback((error: unknown) => {
    if (isAbortError(error)) return;
    console.error(error);
  }, []);
  const mountedRef = useRef(true);
  const unsavedGuardRef = useRef<{ slug: string | null; dirty: boolean }>({
    slug: null,
    dirty: false,
  });
  const contentRef = useRef<PageContent>(content);
  const editVersionRef = useRef(0);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  const localDraftRef = useRef<{ slug: string; content: PageContent } | null>(null);
  const localDraftKey = useCallback((slug: string) => `adminLocalDraft:${slug}`, []);
  const readLocalDraft = useCallback(
    (slug: string) => {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(localDraftKey(slug));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as { slug?: string; content?: PageContent };
        if (parsed?.slug !== slug || !parsed?.content) return null;
        return parsed.content;
      } catch {
        return null;
      }
    },
    [localDraftKey]
  );
  const persistLocalDraft = useCallback(
    (slug: string, nextContent: PageContent) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        localDraftKey(slug),
        JSON.stringify({
          slug,
          content: nextContent,
          updatedAt: new Date().toISOString(),
        })
      );
    },
    [localDraftKey]
  );
  const clearLocalDraft = useCallback(
    (slug: string) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(localDraftKey(slug));
    },
    [localDraftKey]
  );
  const setContentDirty = useCallback(
    (next: PageContent | ((prev: PageContent) => PageContent)) => {
      setContent((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        editVersionRef.current += 1;
        unsavedGuardRef.current = { slug: activePageSlug, dirty: true };
        persistLocalDraft(activePageSlug, resolved);
        setHasUnsaved(true);
        return resolved;
      });
    },
    [activePageSlug, persistLocalDraft]
  );
  const detectLocalDraft = useCallback(
    (slug: string) => {
      const cached = readLocalDraft(slug);
      if (cached) {
        localDraftRef.current = { slug, content: cached };
        setLocalDraftAvailable(true);
        setLocalDraftSlug(slug);
        return cached;
      }
      if (localDraftSlug === slug) {
        setLocalDraftAvailable(false);
        setLocalDraftSlug(null);
        localDraftRef.current = null;
      }
      return null;
    },
    [localDraftSlug, readLocalDraft]
  );
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const slugToLabel = (slug: string) =>
    slug
      .split("/")
      .join(" ")
      .split(/[-_]/g)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const menuSlugs = useMemo(() => {
    const items = globals.menuItems ?? [];
    return items
      .map((item) => item.href ?? "")
      .filter((href) => href.startsWith("/"))
      .map((href) => href.split("?")[0].split("#")[0])
      .map((href) => href.replace(/^\/+/, ""))
      .filter(Boolean);
  }, [globals.menuItems]);

  const pageOptions = useMemo(() => {
    return pageSlugs.map((slug) => ({
      slug,
      label: slug === "home" ? "Home" : slug === "menu" ? "Menu" : slugToLabel(slug),
    }));
  }, [pageSlugs]);

  useEffect(() => {
    if (!pageSlugs.length) return;
    if (!pageSlugs.includes(activePageSlug)) {
      setActivePageSlug(pageSlugs[0]);
    }
  }, [pageSlugs, activePageSlug]);

  const defaultContentForSlug = (slug: string) => {
    if (slug === "menu") return defaultMenuContent;
    if (slug === "gallery") return defaultGalleryContent;
    if (slug === "career") return { ...defaultContent, career: defaultCareerContent };
    if (slug === "contact-us" || slug === "contactus") return defaultContactContent;
    if (slug === "about-us" || slug === "aboutus")
      return { ...defaultContent, about: defaultAboutContent };
    return defaultContent;
  };

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

  const toPlainText = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+\n/g, "\n")
      .trim();

  const extractColors = (html: string | undefined) => {
    if (!html) return [];
    const matches = html.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    return matches.map((color) => color.toLowerCase());
  };

  const introUsedColors = Array.from(
    new Set([
      ...(extractColors(globals.introLogoTextHtml)),
      ...(extractColors(globals.introMottoHtml)),
      ...(extractColors(globals.introBodyHtml)),
      ...(extractColors(globals.introBody2Html)),
      globals.introTextColor?.toLowerCase() ?? "",
    ].filter(Boolean))
  );

  const hasGalleryMedia = (payload?: PageContent) => {
    const gallery = payload?.gallery;
    if (!gallery) return false;
    if (gallery.heroLeft?.url || gallery.heroRight?.url) return true;
    return (gallery.rows ?? []).some((row) => row.items?.some((item) => item.url));
  };

  const extractFirstFontFamily = (html: string | undefined, fallback: string) => {
    if (!html) return fallback;
    const match = html.match(/font-family\s*:\s*([^;"]+)/i);
    if (match?.[1]) return match[1].trim();
    const fontTag = html.match(/face\s*=\s*["']([^"']+)["']/i);
    if (fontTag?.[1]) return fontTag[1].trim();
    return fallback;
  };

  const sampleWords = (html: string | undefined, fallback: string) => {
    const plain = toPlainText(html ?? fallback);
    return plain.split(/\s+/).slice(0, 5).join(" ");
  };

  const resolveIntroValue = (html: string | undefined, fallback: string) => {
    if (!html) return fallback;
    return toPlainText(html).length ? html : fallback;
  };

  const noteCategories: { value: AdminNoteCategory; label: string }[] = [
    { value: "style format", label: "Style format" },
    { value: "feature add", label: "Feature add" },
    { value: "page addition", label: "Page addition" },
    { value: "not working", label: "Not working" },
  ];
  const noteCategoryStyles: Record<AdminNoteCategory, string> = {
    "style format": "border-amber-200/70 bg-amber-50 text-amber-800",
    "feature add": "border-emerald-200/70 bg-emerald-50 text-emerald-800",
    "page addition": "border-sky-200/70 bg-sky-50 text-sky-800",
    "not working": "border-rose-200/70 bg-rose-50 text-rose-800",
  };
  const noteSnippet = (body: string) => {
    const words = body.trim().split(/\s+/).filter(Boolean);
    const preview = words.slice(0, 12).join(" ");
    return words.length > 12 ? `${preview}...` : preview;
  };
  const formatShortDate = (stamp?: string) => {
    if (!stamp) return "";
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) return "";
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };
  const isCareerPage = activePageSlug === "career";
  const isAboutPage = activePageSlug === "about-us" || activePageSlug === "aboutus";
  const isMenuPage = activePageSlug === "menu";
  const isGalleryPage = activePageSlug === "gallery";
  const isContactPage = activePageSlug === "contact-us" || activePageSlug === "contactus";

  const aboutPreviewContent = useMemo(() => {
    if (!isAboutPage) return content;
    const publishedAbout = currentPublishedPage?.about;
    if (!publishedAbout) return content;
    const draftAbout = (content.about ?? {}) as AboutContent;
    const merged = { ...publishedAbout, ...draftAbout };
    if (!draftAbout.heroImageUrl) merged.heroImageUrl = publishedAbout.heroImageUrl;
    if (!draftAbout.heroLogoUrl) merged.heroLogoUrl = publishedAbout.heroLogoUrl;
    if (!draftAbout.sections?.length) merged.sections = publishedAbout.sections;
    return { ...content, about: merged };
  }, [content, currentPublishedPage, isAboutPage]);

  useEffect(() => {
    if (!isAboutPage) return;
    const publishedAbout = currentPublishedPage?.about;
    if (!publishedAbout?.heroImageUrl) return;
    const draftAbout = (content.about ?? {}) as AboutContent;
    if (draftAbout.heroImageUrl) return;
    setContentDirty({
      ...content,
      about: {
        ...publishedAbout,
        ...draftAbout,
        heroImageUrl: publishedAbout.heroImageUrl,
      },
    });
  }, [isAboutPage, currentPublishedPage, content, setContentDirty]);

  useEffect(() => {
    if (!isContactPage) return;
    const publishedContact = currentPublishedPage?.contact;
    if (!publishedContact) return;
    const draftContact = (content.contact ?? {}) as ContactContent;
    if (draftContact.backgroundUrl) return;
    setContentDirty({
      ...content,
      contact: {
        ...publishedContact,
        ...draftContact,
        backgroundUrl: publishedContact.backgroundUrl,
      },
    });
  }, [isContactPage, currentPublishedPage, content, setContentDirty]);

  useEffect(() => {
    if (!isGalleryPage) return;
    const publishedGallery = currentPublishedPage?.gallery;
    if (!publishedGallery) return;
    const draftGallery = (content.gallery ?? {}) as GalleryContent;
    const mergeRows = (draftRows: typeof publishedGallery.rows | undefined) => {
      const fallbackRows = publishedGallery.rows ?? [];
      const rows = (draftRows?.length ? draftRows : fallbackRows).map((row, rowIndex) => {
        const publishedRow = fallbackRows[rowIndex];
        const items = (row.items ?? []).map((item, itemIndex) => {
          if (item.url) return item;
          const publishedItem = publishedRow?.items?.[itemIndex];
          return publishedItem?.url ? { ...publishedItem, ...item } : item;
        });
        return { ...row, items };
      });
      return rows;
    };
    let needsMerge = false;
    const mergedRows = mergeRows(draftGallery.rows);
    mergedRows.forEach((row, rowIndex) => {
      row.items?.forEach((item, itemIndex) => {
        const original = draftGallery.rows?.[rowIndex]?.items?.[itemIndex];
        if (!original?.url && item.url) needsMerge = true;
      });
    });
    if (!draftGallery.heroLeft?.url && publishedGallery.heroLeft?.url) needsMerge = true;
    if (!draftGallery.heroRight?.url && publishedGallery.heroRight?.url) needsMerge = true;
    if (!needsMerge) return;
    const merged = {
      ...publishedGallery,
      ...draftGallery,
      rows: mergedRows,
      heroLeft: draftGallery.heroLeft?.url ? draftGallery.heroLeft : publishedGallery.heroLeft,
      heroRight: draftGallery.heroRight?.url ? draftGallery.heroRight : publishedGallery.heroRight,
    };
    setContentDirty({ ...content, gallery: merged });
  }, [isGalleryPage, currentPublishedPage, content, setContentDirty]);
  const completedNotes = useMemo(() => {
    const notes = (globals.adminNotes ?? []).filter(
      (note) => note.completed && note.completedAt
    );
    return [...notes].sort((a, b) => {
      const aTime = new Date(a.completedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.completedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [globals.adminNotes]);
  const addAdminNote = () => {
    const subject = noteSubject.trim();
    const body = noteBody.trim();
    if (!noteCategory || !subject || !body) {
      setNoteError("Select a note type and add a subject + body before submitting.");
      return;
    }
    const note = {
      id: `note-${Date.now()}`,
      category: noteCategory,
      subject,
      body,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setGlobals((prev) => ({
      ...prev,
      adminNotes: [note, ...(prev.adminNotes ?? [])],
    }));
    setNoteSubject("");
    setNoteBody("");
    setNoteCategory("");
    setNoteError(null);
    setShowNoteForm(false);
  };

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

  const DRAFT_ONLY_SLUGS = useMemo(
    () =>
      new Set([
        "home",
        "menu",
        "career",
        "about-us",
        "gallery",
        "contact-us",
      ]),
    []
  );

  const loadPageList = useCallback(async () => {
    const [{ data: draftData, error: draftError }, { data: publishedData }] =
      await Promise.all([
        supabase.from("pages").select("slug"),
        supabase.from("published_pages").select("slug"),
      ]);
    if (draftError) return;
    const published =
      publishedData?.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)) ??
      [];
    const drafts =
      draftData?.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)) ?? [];
    const draftAllow = drafts.filter((slug) => DRAFT_ONLY_SLUGS.has(slug));
    const unique = Array.from(new Set([...published, ...draftAllow]));
    if (unique.includes("contact-us") && unique.includes("contactus")) {
      const index = unique.indexOf("contactus");
      if (index >= 0) unique.splice(index, 1);
    }

    for (const slug of DRAFT_ONLY_SLUGS) {
      if (unique.includes(slug)) continue;
      const payload = defaultContentForSlug(slug);
      await supabase.from("pages").upsert({
        slug,
        title: payload.title ?? slug,
        draft: payload,
        updated_at: new Date().toISOString(),
      });
      unique.push(slug);
    }

    setPageSlugs(unique);
  }, [supabase, DRAFT_ONLY_SLUGS]);

  const historyChipForSource = (source: HistorySource | null | undefined) => {
    const label =
      source === "publish"
        ? "Published"
        : source === "auto"
          ? "Auto (15m)"
          : "Saved draft";
    const className =
      source === "publish"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : source === "auto"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-stone-200 bg-stone-50 text-stone-600";
    return (
      <span
        className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}
      >
        {label}
      </span>
    );
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const [{ data: pageData }, { data: globalData }] = await Promise.all([
      supabase
        .from("page_draft_history")
        .select("id,slug,draft,created_at,source")
        .eq("slug", activePageSlug)
        .order("created_at", { ascending: false }),
      supabase
        .from("global_settings_history")
        .select("id,key,draft,created_at,source")
        .eq("key", "site")
        .order("created_at", { ascending: false }),
    ]);
    setPageHistory((pageData ?? []) as typeof pageHistory);
    setGlobalHistory((globalData ?? []) as typeof globalHistory);

    const { data: current } = await supabase
      .from("pages")
      .select("published")
      .eq("slug", activePageSlug)
      .single();
    setCurrentPublishedPage((current?.published as PageContent) ?? null);

    const { data: currentGlobals } = await supabase
      .from("global_settings")
      .select("published")
      .eq("key", "site")
      .single();
    setCurrentPublishedGlobals((currentGlobals?.published as GlobalSettings) ?? null);

    if (current?.published) {
      const { data: match } = await supabase
        .from("page_draft_history")
        .select("id")
        .eq("slug", activePageSlug)
        .eq("draft", current.published)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPublishedPageMatchId(match?.id ?? null);
      if (!match?.id && !historyBackfillRef.current.page) {
        historyBackfillRef.current.page = true;
        await supabase.rpc("snapshot_draft_history_force", {
          target_slug: activePageSlug,
          target_draft: current.published,
          target_source: "publish",
        });
        setHistoryLoading(false);
        return;
      }
    } else {
      setPublishedPageMatchId(null);
    }

    if (currentGlobals?.published) {
      const { data: matchGlobals } = await supabase
        .from("global_settings_history")
        .select("id")
        .eq("key", "site")
        .eq("draft", currentGlobals.published)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPublishedGlobalsMatchId(matchGlobals?.id ?? null);
      if (!matchGlobals?.id && !historyBackfillRef.current.globals) {
        historyBackfillRef.current.globals = true;
        await supabase.rpc("snapshot_global_settings_history_force", {
          target_key: "site",
          target_draft: currentGlobals.published,
          target_source: "publish",
        });
        setHistoryLoading(false);
        return;
      }
    } else {
      setPublishedGlobalsMatchId(null);
    }
    setHistoryLoading(false);
  }, [activePageSlug, supabase]);

  const normalizeSlugFromHref = useCallback((href: string) => {
    const trimmed = href.trim();
    if (!trimmed.startsWith("/")) return null;
    if (trimmed.startsWith("//")) return null;
    if (trimmed.startsWith("/#")) return null;
    const [path] = trimmed.split(/[?#]/);
    const slug = path.replace(/^\/+/, "").replace(/\/+$/, "");
    return slug || null;
  }, []);

  const movePageSlug = useCallback(
    async (fromSlug: string, toSlug: string) => {
      if (!fromSlug || !toSlug || fromSlug === toSlug) return;
      if (["home", "menu"].includes(fromSlug) || ["home", "menu"].includes(toSlug)) {
        setStatus("Cannot rename the home or menu base pages.");
        return;
      }
      const { data, error } = await supabase
        .from("pages")
        .select("slug,title,draft,published")
        .in("slug", [fromSlug, toSlug]);
      if (error) {
        setStatus(error.message);
        return;
      }
      const existingFrom = data?.find((row) => row.slug === fromSlug);
      const existingTo = data?.find((row) => row.slug === toSlug);
      if (!existingFrom && !existingTo) return;

      if (existingFrom) {
        const payload = {
          slug: toSlug,
          title: existingFrom.title ?? toSlug,
          draft: existingFrom.draft,
          published: existingFrom.published,
          updated_at: new Date().toISOString(),
        };
        const { error: upsertError } = await supabase.from("pages").upsert(payload);
        if (upsertError) {
          setStatus(upsertError.message);
          return;
        }
      }

      if (existingFrom) {
        const { error: deleteError } = await supabase
          .from("pages")
          .delete()
          .eq("slug", fromSlug);
        if (deleteError) {
          setStatus(deleteError.message);
          return;
        }
      }

      if (activePageSlug === fromSlug) {
        setActivePageSlug(toSlug);
        if (!existingTo && existingFrom?.draft) {
          setContent(existingFrom.draft as PageContent);
        }
      }

      await loadPageList();
      setStatus(`Updated page URL to /${toSlug}.`);
    },
    [activePageSlug, loadPageList, supabase]
  );

  const deletePageSlug = useCallback(
    async (slug: string) => {
      if (!slug || ["home", "menu"].includes(slug)) {
        setStatus("Home and Menu cannot be deleted.");
        return;
      }
      const ok =
        typeof window !== "undefined"
          ? window.confirm(`Delete /${slug}? This cannot be undone.`)
          : false;
      if (!ok) return;
      const [{ error }, { error: publishedError }] = await Promise.all([
        supabase.from("pages").delete().eq("slug", slug),
        supabase
          .from("pages")
          .update({ published: null })
          .eq("slug", slug),
      ]);
      if (error) {
        setStatus(error.message);
        return;
      }
      if (publishedError) {
        setStatus(publishedError.message);
        return;
      }
      setGlobals((prev) => ({
        ...prev,
        menuItems: (prev.menuItems ?? []).filter((item) => {
          const itemSlug = normalizeSlugFromHref(item.href ?? "");
          return itemSlug !== slug;
        }),
      }));
      setPageSlugs((prev) => prev.filter((item) => item !== slug));
      const nextSlug =
        pageSlugs.find((candidate) => candidate && candidate !== slug) ?? "home";
      setActivePageSlug(nextSlug);
      await loadPageList();
      setStatus(`Deleted /${slug}.`);
    },
    [loadPageList, normalizeSlugFromHref, pageSlugs, supabase]
  );

  const cleanupUnusedPages = useCallback(async (opts?: { confirm?: boolean }) => {
    const shouldConfirm = opts?.confirm ?? true;
    const keep = new Set([
      "home",
      "menu",
      activePageSlug,
      ...menuSlugs,
      ...Array.from(DRAFT_ONLY_SLUGS),
    ]);
    const { data, error } = await supabase.from("pages").select("slug");
    if (error) {
      setStatus(error.message);
      return;
    }
    const toDelete =
      data?.map((row) => row.slug).filter((slug) => slug && !keep.has(slug)) ?? [];
    if (!toDelete.length) {
      if (shouldConfirm) setStatus("No unused pages to remove.");
      return;
    }
    if (shouldConfirm) {
      const ok =
        typeof window !== "undefined"
          ? window.confirm(
              `Remove ${toDelete.length} unused page(s)? This cannot be undone.`
            )
          : false;
      if (!ok) return;
    }
    const { error: deleteError } = await supabase
      .from("pages")
      .delete()
      .in("slug", toDelete);
    if (deleteError) {
      setStatus(deleteError.message);
      return;
    }
    await loadPageList();
    if (shouldConfirm) setStatus(`Removed ${toDelete.length} unused page(s).`);
  }, [activePageSlug, loadPageList, menuSlugs, supabase, DRAFT_ONLY_SLUGS]);

  useEffect(() => {
    const current = globals.menuItems ?? [];
    const previous = prevMenuItemsRef.current ?? [];
    const previousById = new Map(previous.map((item) => [item.id, item.href]));
    current.forEach((item) => {
      const prevHref = previousById.get(item.id);
      if (!prevHref || prevHref === item.href) return;
      const fromSlug = normalizeSlugFromHref(prevHref);
      const toSlug = normalizeSlugFromHref(item.href);
      if (fromSlug && toSlug && fromSlug !== toSlug) {
        void movePageSlug(fromSlug, toSlug)
          .then(() => cleanupUnusedPages({ confirm: false }))
          .catch(handleAsyncError);
      }
    });
    prevMenuItemsRef.current = current;
  }, [globals.menuItems, movePageSlug, cleanupUnusedPages, handleAsyncError]);

  useEffect(() => {
    if (panel !== "media") return;
    const timer = window.setTimeout(() => {
      void loadMediaLibrary().catch(handleAsyncError);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [panel, loadMediaLibrary, handleAsyncError]);

  useEffect(() => {
    if (panel !== "history") return;
    void loadHistory().catch(handleAsyncError);
  }, [panel, loadHistory, handleAsyncError]);

  useEffect(() => {
    historyBackfillRef.current = { page: false, globals: false };
  }, [activePageSlug]);

  const containerClass =
    panel === "inline"
      ? "mx-auto flex w-full max-w-none flex-col gap-6 px-0 py-10"
      : "mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10";

  const seedDraftFromPublished = useCallback(
    async (slug: string, payload: PageContent, opts?: { force?: boolean }) => {
      if (!opts?.force && autoSeededDraftsRef.current.has(slug)) return;
      autoSeededDraftsRef.current.add(slug);
      await supabase.from("pages").upsert({
        slug,
        title: payload.title ?? slug,
        draft: payload,
        updated_at: new Date().toISOString(),
      });
      setStatus(`Draft seeded from published for /${slug}.`);
    },
    [supabase]
  );

  const markContentPersisted = (nextContent: PageContent, slug: string) => {
    lastPersistedContentRef.current = JSON.stringify({
      content: nextContent,
      activePageSlug: slug,
    });
    unsavedContentRef.current = false;
    unsavedContentSlugRef.current = slug;
    unsavedGuardRef.current = { slug, dirty: false };
    clearLocalDraft(slug);
    setHasUnsaved(false);
  };

  const loadDraft = useCallback(
    async (slug: string) => {
      const versionAtStart = editVersionRef.current;
      const cached = detectLocalDraft(slug);
      if (cached) {
        if (slug === "gallery") {
          clearLocalDraft(slug);
        } else {
          setContentDirty(cached);
          return;
        }
      }
      const shouldSkip = () => {
        if (slug === "gallery" && !hasGalleryMedia(contentRef.current)) return false;
        return unsavedGuardRef.current.dirty && unsavedGuardRef.current.slug === slug;
      };
      if (shouldSkip()) return;
      const { data } = await supabase
        .from("pages")
        .select("draft,published")
        .eq("slug", slug)
        .single();
      if (!mountedRef.current) return;
      if (shouldSkip()) return;
      if (versionAtStart !== editVersionRef.current) return;
      if (data?.published) {
        setCurrentPublishedPage(data.published as PageContent);
      }
      const draftIsEmptyGallery =
        slug === "gallery" && data?.draft && !hasGalleryMedia(data.draft as PageContent);
      if (data?.draft && !draftIsEmptyGallery) {
        setContent(data.draft as PageContent);
        return;
      }
      if (draftIsEmptyGallery && data?.published) {
        setContent(data.published as PageContent);
        await seedDraftFromPublished(slug, data.published as PageContent, { force: true });
        return;
      }
      if (data?.published) {
        setContent(data.published as PageContent);
        await seedDraftFromPublished(slug, data.published as PageContent);
        return;
      }
      const { data: publishedData } = await supabase
        .from("published_pages")
        .select("content")
        .eq("slug", slug)
        .single();
      if (shouldSkip()) return;
      if (versionAtStart !== editVersionRef.current) return;
      if (publishedData?.content) {
        setCurrentPublishedPage(publishedData.content as PageContent);
        setContent(publishedData.content as PageContent);
        await seedDraftFromPublished(slug, publishedData.content as PageContent, {
          force: slug === "gallery",
        });
        return;
      }
      if (shouldSkip()) return;
      if (versionAtStart !== editVersionRef.current) return;
      setContent(defaultContentForSlug(slug));
    },
    [
      clearLocalDraft,
      detectLocalDraft,
      seedDraftFromPublished,
      setContentDirty,
      supabase,
    ]
  );

  const loadGlobals = useCallback(async () => {
    const { data } = await supabase
      .from("global_settings")
      .select("draft")
      .eq("key", "site")
      .single();
    if (!mountedRef.current) return;
    if (data?.draft) {
      setGlobals(data.draft as GlobalSettings);
    }
  }, [supabase]);

  const loadSession = useCallback(async () => {
    try {
      const hasUnsaved =
        unsavedGuardRef.current.dirty &&
        unsavedGuardRef.current.slug === activePageSlug;
      const { data } = await supabase.auth.getSession();
      if (!mountedRef.current) return;
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
      if (!hasUnsaved) {
        await Promise.all([loadDraft(activePageSlug), loadGlobals(), loadPageList()]);
      } else {
        await loadPageList();
      }
      if (!mountedRef.current) return;
      setLoading(false);
    } catch (error) {
      handleAsyncError(error);
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [activePageSlug, handleAsyncError, loadDraft, loadGlobals, loadPageList, supabase]);

  useEffect(() => {
    void loadSession().catch(handleAsyncError);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadSession().catch(handleAsyncError);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, loadSession, handleAsyncError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminSidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!sidebarDragRef.current) return;
      const next = sidebarDragRef.current.startWidth + (event.clientX - sidebarDragRef.current.startX);
      setSidebarWidth(Math.min(620, Math.max(320, next)));
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
    if (typeof window === "undefined") return;
    if (panel !== "inline" || showSidebar || !inlineEditTarget) return;
    const stored = window.localStorage.getItem(inlinePanelStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setFloatingPanelPos(parsed);
          return;
        }
      } catch {
        // Ignore invalid stored value.
      }
    }
    setFloatingPanelPos({ x: 24, y: 96 });
  }, [inlineEditTarget, inlinePanelStorageKey, panel, showSidebar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleMove = (event: PointerEvent) => {
      if (!floatingPanelDragRef.current) return;
      const panel = floatingPanelRef.current;
      const width = panel?.offsetWidth ?? 360;
      const height = panel?.offsetHeight ?? 480;
      const deltaX = event.clientX - floatingPanelDragRef.current.startX;
      const deltaY = event.clientY - floatingPanelDragRef.current.startY;
      const nextX = clamp(
        floatingPanelDragRef.current.baseX + deltaX,
        16,
        Math.max(16, window.innerWidth - width - 16)
      );
      const nextY = clamp(
        floatingPanelDragRef.current.baseY + deltaY,
        16,
        Math.max(16, window.innerHeight - height - 16)
      );
      setFloatingPanelPos({ x: nextX, y: nextY });
    };
    const handleUp = () => {
      if (!floatingPanelDragRef.current) return;
      floatingPanelDragRef.current = null;
      window.localStorage.setItem(inlinePanelStorageKey, JSON.stringify(floatingPanelPos));
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [floatingPanelPos, inlinePanelStorageKey]);

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
    const cached = readLocalDraft(activePageSlug);
    if (cached) {
      setContentDirty(cached);
    }
  }, [activePageSlug, readLocalDraft, setContentDirty, showSidebar]);

  useEffect(() => {
    if (!sessionEmail) return;
    const resetTimer = window.setTimeout(() => {
      setStatus(null);
      setInlineEditTarget(null);
      setActiveBlockIndex(0);
    }, 0);
    const fetchPage = async () => {
      const versionAtStart = editVersionRef.current;
      const cached = detectLocalDraft(activePageSlug);
      if (cached) {
        setContentDirty(cached);
        return;
      }
      const shouldSkip =
        unsavedGuardRef.current.dirty &&
        unsavedGuardRef.current.slug === activePageSlug;
      if (shouldSkip) return;
      const { data } = await supabase
        .from("pages")
        .select("draft,published")
        .eq("slug", activePageSlug)
        .single();
      if (
        unsavedGuardRef.current.dirty &&
        unsavedGuardRef.current.slug === activePageSlug
      ) {
        return;
      }
      if (versionAtStart !== editVersionRef.current) return;
      if (data?.draft) {
        setContent(data.draft as PageContent);
        markContentPersisted(data.draft as PageContent, activePageSlug);
        return;
      }
      if (data?.published) {
        setContent(data.published as PageContent);
        markContentPersisted(data.published as PageContent, activePageSlug);
        await seedDraftFromPublished(activePageSlug, data.published as PageContent, {
          force: activePageSlug === "gallery",
        });
        return;
      }
      const { data: publishedData } = await supabase
        .from("published_pages")
        .select("content")
        .eq("slug", activePageSlug)
        .single();
      if (
        unsavedGuardRef.current.dirty &&
        unsavedGuardRef.current.slug === activePageSlug
      ) {
        return;
      }
      if (versionAtStart !== editVersionRef.current) return;
      if (publishedData?.content) {
        setContent(publishedData.content as PageContent);
        markContentPersisted(publishedData.content as PageContent, activePageSlug);
        await seedDraftFromPublished(activePageSlug, publishedData.content as PageContent, {
          force: activePageSlug === "gallery",
        });
        return;
      }
      const fallback = defaultContentForSlug(activePageSlug);
      if (versionAtStart !== editVersionRef.current) return;
      if (
        unsavedGuardRef.current.dirty &&
        unsavedGuardRef.current.slug === activePageSlug
      ) {
        return;
      }
      setContent(fallback);
      markContentPersisted(fallback, activePageSlug);
    };
    void fetchPage().catch(handleAsyncError);
    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [
    activePageSlug,
    sessionEmail,
    supabase,
    seedDraftFromPublished,
    handleAsyncError,
    detectLocalDraft,
    setContentDirty,
  ]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), 6000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!role || autoCleanupDoneRef.current) return;
    if (!menuSlugs.length) return;
    autoCleanupDoneRef.current = true;
    void cleanupUnusedPages({ confirm: false }).catch(handleAsyncError);
  }, [role, menuSlugs.length, cleanupUnusedPages, handleAsyncError]);

  useEffect(() => {
    setUrlDraft(`/${activePageSlug}`);
  }, [activePageSlug]);

  useEffect(() => {
    if (!sessionEmail) return;
    void loadDraft(activePageSlug).catch(handleAsyncError);
  }, [activePageSlug, loadDraft, handleAsyncError, sessionEmail]);

  const handleSignIn = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      return;
    }
    await loadSession();
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
    setContentDirty((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, blockIndex) =>
        blockIndex === index ? updated : block
      ),
    }));
  };

  const removeBlock = (index: number) => {
    setContentDirty((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setContentDirty((prev) => {
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
    setContentDirty((prev) => ({
      ...prev,
      blocks: [...prev.blocks, createBlock(selectedBlock)],
    }));
  };

  const resolveSlugForSave = async () => {
    const candidate = normalizeSlugFromHref(urlDraft);
    if (
      candidate &&
      candidate !== activePageSlug &&
      !["home", "menu"].includes(activePageSlug)
    ) {
      const oldSlug = activePageSlug;
      setActivePageSlug(candidate);
      setGlobals((prev) => ({
        ...prev,
        menuItems: (prev.menuItems ?? []).map((item) => {
          const itemSlug = normalizeSlugFromHref(item.href ?? "");
          return itemSlug === oldSlug ? { ...item, href: `/${candidate}` } : item;
        }),
      }));
      await movePageSlug(oldSlug, candidate);
      await cleanupUnusedPages({ confirm: false });
      return candidate;
    }
    return activePageSlug;
  };

  const recordHistory = async (
    source: HistorySource,
    slugToSave: string,
    nextContent: PageContent,
    nextGlobals: GlobalSettings
  ) => {
    await Promise.all([
      supabase.rpc("snapshot_draft_history_force", {
        target_slug: slugToSave,
        target_draft: nextContent,
        target_source: source,
      }),
      supabase.rpc("snapshot_global_settings_history_force", {
        target_key: "site",
        target_draft: nextGlobals,
        target_source: source,
      }),
    ]);
  };

  const saveDraft = async (opts?: { source?: HistorySource; silent?: boolean }) => {
    if (!opts?.silent) {
      setStatus(null);
    }
    setIsSaving(true);
    const slugToSave = await resolveSlugForSave();
    const publishedGalleryFallback =
      slugToSave === "gallery" && currentPublishedPage && hasGalleryMedia(currentPublishedPage)
        ? (currentPublishedPage as PageContent)
        : null;
    const contentToSave =
      slugToSave === "gallery" && publishedGalleryFallback && !hasGalleryMedia(content)
        ? publishedGalleryFallback
        : content;
    if (contentToSave !== content) {
      setContent(contentToSave);
    }
    const source = opts?.source ?? "draft";
    const [{ error: pageError }, { error: globalError }] = await Promise.all([
      supabase.from("pages").upsert({
        slug: slugToSave,
        title: contentToSave.title,
        draft: contentToSave,
        updated_at: new Date().toISOString(),
      }),
      supabase.from("global_settings").upsert({
        key: "site",
        draft: globals,
        updated_at: new Date().toISOString(),
      }),
    ]);
    if (pageError || globalError) {
      if (!opts?.silent) {
        setStatus(pageError?.message || globalError?.message || "Unable to save draft.");
      }
    } else {
      await recordHistory(source, slugToSave, contentToSave, globals);
      markContentPersisted(contentToSave, slugToSave);
      autosaveDirtyRef.current = false;
      autosaveSignatureRef.current = JSON.stringify({
        content: contentToSave,
        globals,
        activePageSlug: slugToSave,
      });
      if (!opts?.silent) {
        setStatus(source === "auto" ? "Autosaved." : "Draft saved.");
      }
    }
    setIsSaving(false);
  };

  const handleToggleSidebar = useCallback(
    async (next: boolean) => {
      setShowSidebar(next);
      const cached = readLocalDraft(activePageSlug) ?? contentRef.current;
      setContentDirty(cached);
      window.setTimeout(() => {
        const refreshed = readLocalDraft(activePageSlug) ?? contentRef.current;
        setContentDirty(refreshed);
      }, 0);
      if (!next) {
        try {
          await saveDraft({ source: "draft", silent: true });
        } catch (error) {
          handleAsyncError(error);
        }
      }
    },
    [activePageSlug, handleAsyncError, readLocalDraft, saveDraft, setContentDirty]
  );

  const createDraftFromPublished = async () => {
    setStatus(null);
    setIsSaving(true);
    const slugToSave = await resolveSlugForSave();
    const candidates = new Set<string>([slugToSave]);
    if (slugToSave === "about-us") candidates.add("aboutus");
    if (slugToSave === "aboutus") candidates.add("about-us");
    const candidateList = Array.from(candidates).flatMap((slug) => [slug, `/${slug}`]);

    let publishedPayload: PageContent | null = null;
    for (const candidate of candidateList) {
      const { data } = await supabase
        .from("pages")
        .select("published")
        .eq("slug", candidate)
        .single();
      if (data?.published) {
        publishedPayload = data.published as PageContent;
        break;
      }
    }
    if (!publishedPayload) {
      for (const candidate of candidateList) {
        const { data } = await supabase
          .from("published_pages")
          .select("content")
          .eq("slug", candidate)
          .single();
        if (data?.content) {
          publishedPayload = data.content as PageContent;
          break;
        }
      }
    }
    if (!publishedPayload) {
      setStatus(`No published content found for /${slugToSave}.`);
      setIsSaving(false);
      return;
    }
    const [{ error: pageError }, { error: globalError }] = await Promise.all([
      supabase.from("pages").upsert({
        slug: slugToSave,
        title: content.title,
        draft: publishedPayload,
        updated_at: new Date().toISOString(),
      }),
      supabase.from("global_settings").upsert({
        key: "site",
        draft: globals,
        updated_at: new Date().toISOString(),
      }),
    ]);
    if (pageError || globalError) {
      setStatus(pageError?.message || globalError?.message || "Unable to create draft.");
    } else {
      setContent(publishedPayload as PageContent);
      await recordHistory("draft", slugToSave, publishedPayload as PageContent, globals);
      markContentPersisted(publishedPayload as PageContent, slugToSave);
      autosaveDirtyRef.current = false;
      autosaveSignatureRef.current = JSON.stringify({
        content: publishedPayload as PageContent,
        globals,
        activePageSlug: slugToSave,
      });
      setStatus("Draft created from published.");
    }
    setIsSaving(false);
  };

  const autosaveRef = useRef<number | null>(null);
  const autosaveDirtyRef = useRef(false);
  const autosaveSignatureRef = useRef<string | null>(null);
  const autoSeededDraftsRef = useRef<Set<string>>(new Set());
  const lastPersistedContentRef = useRef<string | null>(null);
  const unsavedContentRef = useRef(false);
  const unsavedContentSlugRef = useRef<string | null>(null);

  useEffect(() => {
    autosaveDirtyRef.current = false;
    autosaveSignatureRef.current = null;
    lastPersistedContentRef.current = null;
    unsavedContentRef.current = false;
    unsavedContentSlugRef.current = null;
    unsavedGuardRef.current = { slug: null, dirty: false };
    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current);
      autosaveRef.current = null;
    }
  }, [activePageSlug]);

  useEffect(() => {
    if (loading || !role) return;
    if (isSaving || isPublishing) return;
    const signature = JSON.stringify({ content, globals, activePageSlug });
    if (autosaveSignatureRef.current === null) {
      autosaveSignatureRef.current = signature;
      return;
    }
    if (autosaveSignatureRef.current === signature) return;
    autosaveSignatureRef.current = signature;
    autosaveDirtyRef.current = true;
    if (autosaveRef.current) return;
    autosaveRef.current = window.setTimeout(async () => {
      autosaveRef.current = null;
      if (!autosaveDirtyRef.current) return;
      try {
        await saveDraft({ source: "auto", silent: true });
      } catch (error) {
        handleAsyncError(error);
      }
      autosaveDirtyRef.current = false;
    }, AUTOSAVE_INTERVAL_MS);
    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current);
      }
    };
  }, [
    content,
    globals,
    activePageSlug,
    loading,
    role,
    isSaving,
    isPublishing,
    handleAsyncError,
  ]);

  useEffect(() => {
    const signature = JSON.stringify({ content, activePageSlug });
    if (lastPersistedContentRef.current === null) {
      lastPersistedContentRef.current = signature;
      unsavedContentRef.current = false;
      unsavedContentSlugRef.current = activePageSlug;
      unsavedGuardRef.current = { slug: activePageSlug, dirty: false };
      setHasUnsaved(false);
      return;
    }
    if (signature !== lastPersistedContentRef.current) {
      unsavedContentRef.current = true;
      unsavedContentSlugRef.current = activePageSlug;
      unsavedGuardRef.current = { slug: activePageSlug, dirty: true };
      persistLocalDraft(activePageSlug, content);
      setHasUnsaved(true);
      return;
    }
    setHasUnsaved(false);
  }, [content, activePageSlug, persistLocalDraft]);

  const updateBrandMessage = (value: string) => {
    setContentDirty((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.type === "brand-message"
          ? { ...block, data: { ...block.data, message: value } }
          : block
      ),
    }));
  };

  const publishWithPayload = async (
    nextContent: PageContent,
    nextGlobals: GlobalSettings,
    opts?: { updateDraft?: boolean }
  ) => {
    setStatus(null);
    setIsPublishing(true);
    const slugToSave = await resolveSlugForSave();
    const updateDraft = opts?.updateDraft !== false;
    const now = new Date().toISOString();
    const [{ error: pageError }, { error: globalError }] = await Promise.all([
      updateDraft
        ? supabase.from("pages").upsert({
            slug: slugToSave,
            title: nextContent.title,
            draft: nextContent,
            published: nextContent,
            updated_at: now,
          })
        : supabase
            .from("pages")
            .update({ published: nextContent, title: nextContent.title, updated_at: now })
            .eq("slug", slugToSave),
      updateDraft
        ? supabase.from("global_settings").upsert({
            key: "site",
            draft: nextGlobals,
            published: nextGlobals,
            updated_at: now,
          })
        : supabase
            .from("global_settings")
            .update({ published: nextGlobals, updated_at: now })
            .eq("key", "site"),
    ]);
    if (pageError || globalError) {
      setStatus(
        pageError?.message || globalError?.message || "Unable to publish changes."
      );
    } else {
      const { data: publishedCheck, error: publishedError } = await supabase
        .from("published_pages")
        .select("slug")
        .eq("slug", slugToSave)
        .single();
      if (publishedError || !publishedCheck?.slug) {
        setStatus(
          `Published, but /${slugToSave} is not visible yet. Try again or refresh.`
        );
      } else {
        setStatus("Published to live site.");
      }
      await recordHistory("publish", slugToSave, nextContent, nextGlobals);
      markContentPersisted(nextContent, slugToSave);
      autosaveDirtyRef.current = false;
      autosaveSignatureRef.current = JSON.stringify({
        content: nextContent,
        globals: nextGlobals,
        activePageSlug: slugToSave,
      });
    }
    setContent(nextContent);
    setGlobals(nextGlobals);
    setIsPublishing(false);
  };

  const publish = async () => publishWithPayload(content, globals);

  const restoreLocalDraft = useCallback(() => {
    const cached = localDraftRef.current;
    if (!cached || cached.slug !== activePageSlug) return;
    setContentDirty(cached.content);
    setLocalDraftAvailable(false);
    setLocalDraftSlug(null);
  }, [activePageSlug, setContentDirty]);

  const discardLocalDraft = useCallback(() => {
    if (!activePageSlug) return;
    clearLocalDraft(activePageSlug);
    setLocalDraftAvailable(false);
    setLocalDraftSlug(null);
    localDraftRef.current = null;
  }, [activePageSlug, clearLocalDraft]);

  const revertToSaved = useCallback(() => {
    const raw = lastPersistedContentRef.current;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        content?: PageContent;
        activePageSlug?: string;
      };
      if (parsed?.content && parsed.activePageSlug === activePageSlug) {
        setContent(parsed.content);
        markContentPersisted(parsed.content, activePageSlug);
        setStatus("Reverted to last saved draft.");
        return;
      }
    } catch {
      // Ignore invalid persisted value.
    }
  }, [activePageSlug]);

  const checkLiveSlug = async () => {
    const slug = activePageSlug;
    const variants = [slug, `/${slug}`];
    const { data, error } = await supabase
      .from("published_pages")
      .select("slug, updated_at")
      .in("slug", variants);
    if (error) {
      setStatus(error.message);
      return;
    }
    if (!data || data.length === 0) {
      setStatus(`No published page found for ${variants.join(" or ")}.`);
      return;
    }
    const found = data.map((row) => row.slug).join(", ");
    setStatus(`Published slug(s) found: ${found}`);
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
              onClick={() => void handleSignIn().catch(handleAsyncError)}
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
      <div className="min-h-screen bg-stone-50 text-stone-800">
        <div className="flex min-h-screen">
          {showSidebar ? (
            <aside
              className="sticky top-0 z-[100] hidden h-screen flex-shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-stone-200 bg-white px-5 py-8 shadow-sm lg:flex"
              style={{
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
              }}
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
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-stone-900">Workspace</p>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  <span className="min-w-[26px] rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-center text-[11px] font-semibold text-rose-700 tabular-nums">
                    {adminNotes.filter((note) => !note.completed).length}
                  </span>
                  <span className="min-w-[26px] rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-[11px] font-semibold text-emerald-700 tabular-nums">
                    {adminNotes.filter((note) => note.completed).length}
                  </span>
                </div>
              </div>
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
            <button
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-left"
              onClick={() => setPanel("history")}
            >
              <p className="font-semibold text-stone-900">History</p>
              <p className="text-xs text-stone-500">Draft snapshots</p>
            </button>
          </div>
          {panel === "inline" && showSidebar && (
            <InlineEditPanel
              target={inlineEditTarget}
              content={content}
              globals={globals}
              onChangeContent={setContentDirty}
              onChangeGlobals={setGlobals}
              onClear={() => setInlineEditTarget(null)}
            />
          )}
          <div className="mt-auto space-y-3">
            <button
              className="w-full rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
              onClick={() => {
                void saveDraft().catch(handleAsyncError);
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button
              className="w-full rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
              onClick={() => {
                setDraftConfirmChecked(false);
                setShowDraftConfirm(true);
              }}
              disabled={isSaving}
            >
              Create draft from published
            </button>
            <button
              className="w-full rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
              onClick={() => void publish().catch(handleAsyncError)}
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

        <div className="relative z-0 flex-1">
          <div className={containerClass}>
            {status ? (
              <div className="fixed right-6 top-6 z-[80] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-lg">
                {status}
              </div>
            ) : null}
            {panel !== "identity" && (hasUnsaved || localDraftAvailable) ? (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-xs text-stone-700 shadow-sm">
                {hasUnsaved ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Unsaved changes
                  </span>
                ) : null}
                {localDraftAvailable && localDraftSlug === activePageSlug ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                    Local draft available
                  </span>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2">
                  {localDraftAvailable && localDraftSlug === activePageSlug ? (
                    <>
                      <button
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        onClick={restoreLocalDraft}
                      >
                        Restore local draft
                      </button>
                      <button
                        className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700"
                        onClick={discardLocalDraft}
                      >
                        Discard local draft
                      </button>
                    </>
                  ) : null}
                  {hasUnsaved ? (
                    <button
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700"
                      onClick={revertToSaved}
                    >
                      Revert to last saved
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {showDraftConfirm && typeof document !== "undefined"
              ? createPortal(
                  <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-6">
                    <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
                      <h3 className="text-lg font-semibold text-stone-900">
                        Create draft from published?
                      </h3>
                      <p className="mt-2 text-sm text-stone-600">
                        This will overwrite your current draft with the published version.
                      </p>
                      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
                        <input
                          type="checkbox"
                          checked={draftConfirmChecked}
                          onChange={(event) => setDraftConfirmChecked(event.target.checked)}
                        />
                        Yes, replace the current draft.
                      </label>
                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                          className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
                          onClick={() => setShowDraftConfirm(false)}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                          onClick={() => {
                            setShowDraftConfirm(false);
                            void createDraftFromPublished().catch(handleAsyncError);
                          }}
                          disabled={!draftConfirmChecked}
                          type="button"
                        >
                          Yes, replace draft
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )
              : null}
            {panel === "inline" && !showSidebar && inlineEditTarget && typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={(node) => {
                      floatingPanelRef.current = node;
                    }}
                    className="fixed z-[2000] w-[380px] max-w-[92vw] rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur"
                    style={{ left: floatingPanelPos.x, top: floatingPanelPos.y }}
                  >
                    <div
                      className="flex cursor-move items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500"
                      onPointerDown={(event) => {
                        floatingPanelDragRef.current = {
                          startX: event.clientX,
                          startY: event.clientY,
                          baseX: floatingPanelPos.x,
                          baseY: floatingPanelPos.y,
                        };
                      }}
                    >
                      <span>{floatingPanelLabel}</span>
                      <button
                        className="rounded-full border border-stone-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
                        onClick={() => setInlineEditTarget(null)}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        X
                      </button>
                    </div>
                    <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
                      <InlineEditPanel
                        target={inlineEditTarget}
                        content={content}
                        globals={globals}
                        onChangeContent={setContentDirty}
                        onChangeGlobals={setGlobals}
                        onClear={() => setInlineEditTarget(null)}
                      />
                    </div>
                  </div>,
                  document.body
                )
              : null}
            {panel === "inline" ? (
              <div
                className={`fixed top-4 z-50 transition-opacity ${
                  showChipsToggle || showNoteForm
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
                style={{ left: showSidebar ? sidebarWidth + 16 : 16 }}
                onMouseEnter={() => setShowChipsToggle(true)}
                onMouseLeave={() => {
                  if (showNoteForm) return;
                  setShowChipsToggle(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {!showSidebar ? (
                    <button
                      className="rounded-full border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                      onClick={() => void handleToggleSidebar(true)}
                    >
                      Show sidebar
                    </button>
                  ) : null}
                  {showSidebar ? (
                    <button
                      className="rounded-full border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                      onClick={() => void handleToggleSidebar(false)}
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
                  <button
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm"
                    onClick={() => {
                      setShowNoteForm((prev) => !prev);
                      setNoteError(null);
                      setShowChipsToggle(true);
                    }}
                  >
                    {showNoteForm ? "Close note" : "Admin note"}
                  </button>
                </div>
                {showNoteForm ? (
                  <div
                    className="mt-3 w-[340px] rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-xl"
                    style={{ backdropFilter: "blur(6px)" }}
                  >
                    <div className="grid gap-3">
                          <label className="space-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Category
                        <select
                          className={formInput}
                          value={noteCategory}
                          onChange={(event) =>
                            setNoteCategory(event.target.value as AdminNoteCategory)
                          }
                        >
                          <option value="">Select a note type</option>
                          {noteCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Subject
                        <input
                          className={formInput}
                          value={noteSubject}
                          onChange={(event) => setNoteSubject(event.target.value)}
                          placeholder="Short summary"
                        />
                      </label>
                      <label className="space-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Body
                        <textarea
                          className={`${formInput} min-h-[90px] resize-y`}
                          value={noteBody}
                          onChange={(event) => setNoteBody(event.target.value)}
                          placeholder="Describe the request or issue"
                        />
                      </label>
                      {noteError ? (
                        <p className="text-sm text-rose-600">{noteError}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white"
                          onClick={addAdminNote}
                        >
                          Submit
                        </button>
                        <button
                          className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold"
                          onClick={() => setShowNoteForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
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
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
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

                  <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                          Admin notes
                        </p>
                        <p className="mt-2 text-sm text-stone-600">
                          Leave notes for the developer about website items.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
                        <span>Open</span>
                        <span className="min-w-[26px] rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-center text-[11px] font-semibold text-rose-700 tabular-nums">
                          {adminNotes.filter((note) => !note.completed).length}
                        </span>
                        <span>Done</span>
                        <span className="min-w-[26px] rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-[11px] font-semibold text-emerald-700 tabular-nums">
                          {adminNotes.filter((note) => note.completed).length}
                        </span>
                      </div>
                      <button
                        className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                        onClick={() => {
                          setShowNoteForm((prev) => !prev);
                          setNoteError(null);
                        }}
                      >
                        {showNoteForm ? "Close form" : "Add note"}
                      </button>
                    </div>

                    {showNoteForm ? (
                      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Category
                            <select
                              className={formInput}
                              value={noteCategory}
                              onChange={(event) =>
                                setNoteCategory(event.target.value as AdminNoteCategory)
                              }
                            >
                              {noteCategories.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Subject
                            <input
                              className={formInput}
                              value={noteSubject}
                              onChange={(event) => setNoteSubject(event.target.value)}
                              placeholder="Short summary"
                            />
                          </label>
                        </div>
                        <label className="mt-4 block space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Body
                          <textarea
                            className={`${formInput} min-h-[120px] resize-y`}
                            value={noteBody}
                            onChange={(event) => setNoteBody(event.target.value)}
                            placeholder="Describe the request or issue"
                          />
                        </label>
                        {noteError ? (
                          <p className="mt-3 text-sm text-rose-600">{noteError}</p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white"
                            onClick={addAdminNote}
                          >
                            Submit note
                          </button>
                          <button
                            className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                            onClick={() => setShowNoteForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 space-y-3">
                      {adminNotes.length ? (
                        adminNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                              <span
                                className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${noteCategoryStyles[note.category]}`}
                              >
                                {note.category}
                              </span>
                              <span>
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                              <label className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-stone-300"
                                  checked={note.completed ?? false}
                                  onChange={(event) =>
                                    setGlobals((prev) => ({
                                      ...prev,
                                      adminNotes: (prev.adminNotes ?? []).map((item) =>
                                        item.id === note.id
                                          ? {
                                              ...item,
                                              completed: event.target.checked,
                                              completedAt: event.target.checked
                                                ? new Date().toISOString()
                                                : undefined,
                                            }
                                          : item
                                      ),
                                    }))
                                  }
                                />
                                {note.completed ? "Completed" : "Open"}
                              </label>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-stone-900">
                              {note.subject}
                            </p>
                            <p className="mt-1 text-sm text-stone-600">
                              {noteSnippet(note.body)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-500">
                          No notes yet. Add one to start a running list.
                        </p>
                      )}
                    </div>
                  </section>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                        New notes log
                      </p>
                      <div
                        className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1"
                        onScroll={(event) => {
                          const target = event.currentTarget;
                          if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                            setVisibleNewNotes((prev) =>
                              Math.min(prev + 5, adminNotes.length)
                            );
                          }
                        }}
                      >
                        {adminNotes.length ? (
                          adminNotes.slice(0, visibleNewNotes).map((note) => (
                            <div key={note.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                              <p className="text-2xl font-semibold text-stone-900 tabular-nums">
                                {formatShortDate(note.createdAt)}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-900">
                                {note.subject}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                                {note.category}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-stone-500">No notes yet.</p>
                        )}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                        Completed log
                      </p>
                      <div
                        className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1"
                        onScroll={(event) => {
                          const target = event.currentTarget;
                          if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                            setVisibleCompletedNotes((prev) =>
                              Math.min(prev + 5, completedNotes.length)
                            );
                          }
                        }}
                      >
                        {completedNotes.length ? (
                          completedNotes.slice(0, visibleCompletedNotes).map((note) => (
                              <div key={note.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                <p className="text-2xl font-semibold text-emerald-900 tabular-nums">
                                  {formatShortDate(note.completedAt)}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-emerald-900">
                                  {note.subject}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-700">
                                  {note.category}
                                </p>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-stone-500">No completed notes yet.</p>
                        )}
                      </div>
                    </section>
                  </aside>
                </div>
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
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Facebook URL
                            <input
                              className={formInput}
                              placeholder="https://facebook.com/..."
                              value={globals.facebookUrl ?? ""}
                              onChange={(event) =>
                                setGlobals({ ...globals, facebookUrl: event.target.value })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Instagram URL
                            <input
                              className={formInput}
                              placeholder="https://instagram.com/..."
                              value={globals.instagramUrl ?? ""}
                              onChange={(event) =>
                                setGlobals({ ...globals, instagramUrl: event.target.value })
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
                                  onFocus={() => {
                                    menuHrefEditRef.current[item.id] = item.href;
                                  }}
                                  onChange={(event) =>
                                    updateMenuItems(
                                      menuItems.map((current) =>
                                        current.id === item.id
                                          ? { ...current, href: event.target.value }
                                          : current
                                      )
                                    )
                                  }
                                  onBlur={(event) => {
                                    const previous = menuHrefEditRef.current[item.id] ?? item.href;
                                    const rawNext = event.target.value.replace(/\s+/g, "");
                                    const isExternal =
                                      rawNext.startsWith("http://") ||
                                      rawNext.startsWith("https://") ||
                                      rawNext.startsWith("mailto:") ||
                                      rawNext.startsWith("#");
                                    const normalizedNext = isExternal
                                      ? null
                                      : normalizeSlugFromHref(rawNext) ??
                                        normalizeSlugFromHref(`/${rawNext}`);
                                    const next = normalizedNext ? `/${normalizedNext}` : rawNext;
                                    menuHrefEditRef.current[item.id] = next;
                                    if (next !== item.href) {
                                      updateMenuItems(
                                        menuItems.map((current) =>
                                          current.id === item.id
                                            ? { ...current, href: next }
                                            : current
                                        )
                                      );
                                    }
                                    const fromSlug = normalizeSlugFromHref(previous);
                                    const toSlug = normalizedNext;
                                    if (fromSlug && toSlug && fromSlug !== toSlug) {
                                      void movePageSlug(fromSlug, toSlug)
                                        .then(() => cleanupUnusedPages({ confirm: false }))
                                        .catch(handleAsyncError);
                                    }
                                    if (!toSlug && !isExternal) {
                                      setStatus("URL must start with / and include a path.");
                                    }
                                  }}
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
                    Brand message
                    <textarea
                      className={`${formInput} min-h-[90px]`}
                      value={
                        content.blocks.find((block) => block.type === "brand-message")
                          ?.data?.message ?? ""
                      }
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
                        setContentDirty({ ...content, title: event.target.value })
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
                  <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
                    <div className="relative h-[680px] w-full bg-stone-50">
                      <div className="absolute inset-0">
                        <HomePageShell
                          globals={globals}
                          links={
                            globals.menuItems?.length
                              ? globals.menuItems.map((item) => ({
                                  href: item.href,
                                  label: item.label,
                                }))
                              : [
                                  { href: "/about-us", label: "About us" },
                                  { href: "/menu", label: "Menu" },
                                  { href: "/gallery", label: "Gallery" },
                                  { href: "/career", label: "Career" },
                                  { href: "/contact-us", label: "Contact us" },
                                ]
                          }
                          allowOverflow
                        >
                          <BlockRenderer blocks={content.blocks} globals={globals} />
                        </HomePageShell>
                      </div>
                      <IntroOverlay
                        mode="preview"
                        logoText={globals.logoText}
                        motto={globals.motto}
                        logoTextHtml={globals.introLogoTextHtml}
                        logoTextRich={globals.introLogoTextRich}
                        mottoHtml={globals.introMottoHtml}
                        mottoRich={globals.introMottoRich}
                        bodyText={globals.introBody ?? ""}
                        bodyHtml={globals.introBodyHtml}
                        bodyRich={globals.introBodyRich}
                        body2Text={globals.introBody2 ?? ""}
                        body2Html={globals.introBody2Html}
                        body2Rich={globals.introBody2Rich}
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
                        logoMark={globals.logoMark}
                        logoImageUrl={globals.logoImageUrl}
                        showLogoMark={globals.showLogoMark}
                        logoScale={globals.introLogoScale ?? 1}
                        logoX={globals.introLogoX ?? 0}
                        logoY={globals.introLogoY ?? 0}
                        showLogoText={globals.showLogoText}
                        enabled={globals.introEnabled}
                        bgFrom={globals.introBgFrom}
                        bgVia={globals.introBgVia}
                        bgTo={globals.introBgTo}
                        textColor={globals.introTextColor}
                        wipeColor={globals.introWipeColor}
                        holdMs={globals.introHoldMs}
                        wipeMs={globals.introWipeMs}
                        fadeMs={globals.introFadeMs}
                        animationType={globals.introAnimationType}
                        staticPreview={introStaticPreview}
                        previewRevealMs={introRevealMs}
                        playId={introPreviewKey}
                        onDone={handleIntroDone}
                        editable
                        onLogoTextHtmlChange={(next) => {
                          const safe = sanitizeRichHtml(next);
                          const plain = toPlainText(safe);
                          setGlobals({
                            ...globals,
                            logoText: plain,
                            introLogoTextHtml: safe,
                            introLogoTextRich: true,
                          });
                        }}
                        onMottoHtmlChange={(next) => {
                          const safe = sanitizeRichHtml(next);
                          const plain = toPlainText(safe);
                          setGlobals({
                            ...globals,
                            motto: plain,
                            introMottoHtml: safe,
                            introMottoRich: true,
                          });
                        }}
                        onBodyHtmlChange={(next) => {
                          const safe = sanitizeRichHtml(next);
                          const plain = toPlainText(safe);
                          setGlobals({
                            ...globals,
                            introBody: plain,
                            introBodyHtml: safe,
                            introBodyRich: true,
                          });
                        }}
                        onBody2HtmlChange={(next) => {
                          const safe = sanitizeRichHtml(next);
                          const plain = toPlainText(safe);
                          setGlobals({
                            ...globals,
                            introBody2: plain,
                            introBody2Html: safe,
                            introBody2Rich: true,
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Intro controls
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
                        onClick={() =>
                          setIntroDetailsOpen({
                            text: false,
                            basics: false,
                            logo: false,
                            colors: false,
                            timing: false,
                          })
                        }
                      >
                        Collapse all
                      </button>
                      <button
                        className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
                        onClick={() =>
                          setIntroDetailsOpen({
                            text: true,
                            basics: true,
                            logo: true,
                            colors: true,
                            timing: true,
                          })
                        }
                      >
                        Expand all
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-2">
                    <details
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                      open={introDetailsOpen.text}
                      onToggle={(event) =>
                        setIntroDetailsOpen((prev) => ({
                          ...prev,
                          text: (event.target as HTMLDetailsElement).open ?? false,
                        }))
                      }
                    >
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Text
                      </summary>
                      <div className="mt-4 grid gap-4">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Logo text
                          <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            <input
                              type="checkbox"
                              checked={globals.showLogoText ?? true}
                              onChange={(event) =>
                                setGlobals({
                                  ...globals,
                                  showLogoText: event.target.checked,
                                })
                              }
                            />
                            Show in intro
                          </div>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            <span>Font</span>
                            <span
                              className="text-xs normal-case tracking-normal text-stone-700"
                              style={{
                                fontFamily: extractFirstFontFamily(
                                  globals.introLogoTextHtml,
                                  fontFamilyForKey(
                                    globals.logoTextStyle?.font ?? globals.bodyFont
                                  )
                                ),
                              }}
                            >
                              {sampleWords(globals.introLogoTextHtml, globals.logoText)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <RichTextEditor
                              value={resolveIntroValue(
                                globals.introLogoTextHtml,
                                globals.logoText
                              )}
                              onChange={(next) => {
                                const safe = sanitizeRichHtml(next);
                                const plain = toPlainText(safe);
                                setGlobals({
                                  ...globals,
                                  logoText: plain,
                                  introLogoTextHtml: safe,
                                  introLogoTextRich: true,
                                });
                              }}
                              fonts={fontOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                                family: fontFamilyForKey(option.value),
                              }))}
                              usedColors={introUsedColors}
                            />
                          </div>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Motto
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            <span>Font</span>
                            <span
                              className="text-xs normal-case tracking-normal text-stone-700"
                              style={{
                                fontFamily: extractFirstFontFamily(
                                  globals.introMottoHtml,
                                  fontFamilyForKey(globals.mottoFont)
                                ),
                              }}
                            >
                              {sampleWords(globals.introMottoHtml, globals.motto)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <RichTextEditor
                              value={resolveIntroValue(
                                globals.introMottoHtml,
                                globals.motto
                              )}
                              onChange={(next) => {
                                const safe = sanitizeRichHtml(next);
                                const plain = toPlainText(safe);
                                setGlobals({
                                  ...globals,
                                  motto: plain,
                                  introMottoHtml: safe,
                                  introMottoRich: true,
                                });
                              }}
                              fonts={fontOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                                family: fontFamilyForKey(option.value),
                              }))}
                              usedColors={introUsedColors}
                            />
                          </div>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Body line 1
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            <span>Font</span>
                            <span
                              className="text-xs normal-case tracking-normal text-stone-700"
                              style={{
                                fontFamily: extractFirstFontFamily(
                                  globals.introBodyHtml,
                                  fontFamilyForKey(globals.bodyFont)
                                ),
                              }}
                            >
                              {sampleWords(globals.introBodyHtml, globals.introBody ?? "")}
                            </span>
                          </div>
                          <div className="mt-2">
                            <RichTextEditor
                              value={resolveIntroValue(
                                globals.introBodyHtml,
                                globals.introBody || ""
                              )}
                              onChange={(next) => {
                                const safe = sanitizeRichHtml(next);
                                const plain = toPlainText(safe);
                                setGlobals({
                                  ...globals,
                                  introBody: plain,
                                  introBodyHtml: safe,
                                  introBodyRich: true,
                                });
                              }}
                              fonts={fontOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                                family: fontFamilyForKey(option.value),
                              }))}
                              usedColors={introUsedColors}
                            />
                          </div>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Body line 2 (Come for the ritual…)
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            <span>Font</span>
                            <span
                              className="text-xs normal-case tracking-normal text-stone-700"
                              style={{
                                fontFamily: extractFirstFontFamily(
                                  globals.introBody2Html,
                                  fontFamilyForKey(globals.bodyFont)
                                ),
                              }}
                            >
                              {sampleWords(globals.introBody2Html, globals.introBody2 ?? "")}
                            </span>
                          </div>
                          <div className="mt-2">
                            <RichTextEditor
                              value={resolveIntroValue(
                                globals.introBody2Html,
                                globals.introBody2 || ""
                              )}
                              onChange={(next) => {
                                const safe = sanitizeRichHtml(next);
                                const plain = toPlainText(safe);
                                setGlobals({
                                  ...globals,
                                  introBody2: plain,
                                  introBody2Html: safe,
                                  introBody2Rich: true,
                                });
                              }}
                              fonts={fontOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                                family: fontFamilyForKey(option.value),
                              }))}
                              usedColors={introUsedColors}
                            />
                          </div>
                        </label>
                      </div>
                    </details>
                    <details
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                      open={introDetailsOpen.basics}
                      onToggle={(event) =>
                        setIntroDetailsOpen((prev) => ({
                          ...prev,
                          basics: (event.target as HTMLDetailsElement).open ?? false,
                        }))
                      }
                    >
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Intro basics
                      </summary>
                      <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          <input
                            type="checkbox"
                            checked={globals.introEnabled ?? true}
                            onChange={(event) =>
                              setGlobals({ ...globals, introEnabled: event.target.checked })
                            }
                          />
                          Intro enabled
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          <input
                            type="checkbox"
                            checked={introStaticPreview}
                            onChange={(event) => setIntroStaticPreview(event.target.checked)}
                          />
                          Static preview
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Reveal (ms)
                          <input
                            className={formInput}
                            type="number"
                            min={500}
                            max={8000}
                            value={introRevealMs}
                            onChange={(event) => setIntroRevealMs(Number(event.target.value))}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                          Animation type
                          <select
                            className={formInput}
                            value={globals.introAnimationType ?? "wipe"}
                            onChange={(event) =>
                              setGlobals({
                                ...globals,
                                introAnimationType: event.target.value as
                                  | "wipe"
                                  | "fade"
                                  | "slide"
                                  | "radial"
                                  | "pour"
                                  | "iris"
                                  | "diagonal"
                                  | "shutter"
                                  | "steam"
                                  | "dissolve",
                              })
                            }
                          >
                            <option value="wipe">Curtain wipe</option>
                            <option value="fade">Soft fade (reveal)</option>
                            <option value="slide">Slide up (reveal)</option>
                            <option value="radial">Radial bloom</option>
                            <option value="pour">Coffee pour (wave)</option>
                            <option value="iris">Iris open</option>
                            <option value="diagonal">Diagonal sweep</option>
                            <option value="shutter">Shutter blinds</option>
                            <option value="steam">Steam fade</option>
                            <option value="dissolve">Grain dissolve</option>
                          </select>
                        </label>
                      </div>
                    </details>
                    <details
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                      open={introDetailsOpen.logo}
                      onToggle={(event) =>
                        setIntroDetailsOpen((prev) => ({
                          ...prev,
                          logo: (event.target as HTMLDetailsElement).open ?? false,
                        }))
                      }
                    >
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Logo position
                      </summary>
                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo scale
                      <input
                        className={formInput}
                        type="number"
                        min={0.4}
                        max={3}
                        step={0.05}
                        value={globals.introLogoScale ?? 1}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introLogoScale: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo X (px)
                      <input
                        className={formInput}
                        type="number"
                        min={-200}
                        max={200}
                        value={globals.introLogoX ?? 0}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introLogoX: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Logo Y (px)
                      <input
                        className={formInput}
                        type="number"
                        min={-200}
                        max={200}
                        value={globals.introLogoY ?? 0}
                        onChange={(event) =>
                          setGlobals({
                            ...globals,
                            introLogoY: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                      </div>
                    </details>
                    <details
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                      open={introDetailsOpen.colors}
                      onToggle={(event) =>
                        setIntroDetailsOpen((prev) => ({
                          ...prev,
                          colors: (event.target as HTMLDetailsElement).open ?? false,
                        }))
                      }
                    >
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Colors
                      </summary>
                      <div className="mt-4 grid gap-6 lg:grid-cols-2">
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
                    </details>
                    <details
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                      open={introDetailsOpen.timing}
                      onToggle={(event) =>
                        setIntroDetailsOpen((prev) => ({
                          ...prev,
                          timing: (event.target as HTMLDetailsElement).open ?? false,
                        }))
                      }
                    >
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Timing
                      </summary>
                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
                    </details>
                  </div>
                </section>
              )}

              {panel === "inline" && (
                <section className="space-y-6">
                  <div className="relative z-60 flex flex-wrap items-center justify-between gap-3 px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                        Edit Page
                      </p>
                      <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm">
                        <span className="uppercase tracking-[0.2em] text-stone-500">URL</span>
                        <input
                          className="w-40 bg-transparent text-xs font-semibold text-stone-700 outline-none"
                          value={urlDraft}
                          disabled={["home", "menu"].includes(activePageSlug)}
                          onChange={(event) => setUrlDraft(event.target.value.replace(/\s+/g, ""))}
                          onBlur={() => {
                            const input = urlDraft;
                            const nextSlug = normalizeSlugFromHref(input);
                            if (!nextSlug) {
                              setStatus("URL must start with / and include a path.");
                              setUrlDraft(`/${activePageSlug}`);
                              return;
                            }
                            if (["home", "menu"].includes(activePageSlug)) {
                              setStatus("Cannot rename the home or menu base pages.");
                              setUrlDraft(`/${activePageSlug}`);
                              return;
                            }
                            if (nextSlug !== activePageSlug) {
                              const oldSlug = activePageSlug;
                              setActivePageSlug(nextSlug);
                              setGlobals((prev) => ({
                                ...prev,
                                menuItems: (prev.menuItems ?? []).map((item) => {
                                  const itemSlug = normalizeSlugFromHref(item.href ?? "");
                                  return itemSlug === oldSlug
                                    ? { ...item, href: `/${nextSlug}` }
                                    : item;
                                }),
                              }));
                              void movePageSlug(oldSlug, nextSlug).then(() =>
                                cleanupUnusedPages({ confirm: false })
                              ).catch(handleAsyncError);
                            }
                            setUrlDraft(`/${nextSlug}`);
                          }}
                        />
                      </label>
                      <button
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm"
                        onClick={() => {
                          void cleanupUnusedPages().catch(handleAsyncError);
                        }}
                      >
                        Clean up URLs
                      </button>
                      <button
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void deletePageSlug(activePageSlug).catch(handleAsyncError)}
                        disabled={["home", "menu"].includes(activePageSlug)}
                      >
                        Delete page
                      </button>
                      <button
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm"
                        onClick={() => void checkLiveSlug().catch(handleAsyncError)}
                      >
                        Check live slug
                      </button>
                      <select
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm"
                        value={activePageSlug}
                        onChange={(event) => setActivePageSlug(event.target.value)}
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
                                  { href: "/about-us", label: "About us" },
                                  { href: "/menu", label: "Menu" },
                                  { href: "/gallery", label: "Gallery" },
                                  { href: "/career", label: "Career" },
                                  { href: "/contact-us", label: "Contact us" },
                                ]
                          }
                        >
                          {isCareerPage ? (
                            <CareerInlinePreview
                              content={content}
                              globals={globals}
                              positions={careerPreviewPositions}
                              onSelectEdit={handleInlineSelect}
                            />
                          ) : isMenuPage ? (
                            <MenuInlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                            />
                          ) : isGalleryPage ? (
                            <GalleryInlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                            />
                          ) : isContactPage ? (
                            <ContactInlinePreview
                              content={content}
                              globals={globals}
                              onSelectEdit={handleInlineSelect}
                            />
                          ) : isAboutPage ? (
                            <AboutInlinePreview
                              content={aboutPreviewContent}
                              globals={globals}
                              onSelectEdit={handleInlineSelect}
                              onChangeContent={setContentDirty}
                            />
                          ) : (
                            <InlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                              onChangeGlobals={setGlobals}
                              activeEdit={inlineEditTarget}
                              onSelectEdit={handleInlineSelect}
                              mode={previewMode}
                              layout="frame"
                              showChips={showInlineChips}
                            />
                          )}
                        </HomePageShell>
                      </div>
                    ) : (
                      <div className="my-6 w-full">
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
                                    { href: "/about-us", label: "About us" },
                                    { href: "/menu", label: "Menu" },
                                    { href: "/gallery", label: "Gallery" },
                                    { href: "/career", label: "Career" },
                                    { href: "/contact-us", label: "Contact us" },
                                  ]
                                : [
                                    { href: "/about-us", label: "About us" },
                                    { href: "/menu", label: "Menu" },
                                    { href: "/gallery", label: "Gallery" },
                                    { href: "/career", label: "Career" },
                                    { href: "/contact-us", label: "Contact us" },
                                  ]
                        }
                        allowOverflow
                      >
                          {isCareerPage ? (
                            <CareerInlinePreview
                              content={content}
                              globals={globals}
                              positions={careerPreviewPositions}
                              onSelectEdit={handleInlineSelect}
                            />
                          ) : isMenuPage ? (
                            <MenuInlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                            />
                          ) : isGalleryPage ? (
                            <GalleryInlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                            />
                          ) : isContactPage ? (
                            <ContactInlinePreview
                              content={content}
                              globals={globals}
                              onSelectEdit={handleInlineSelect}
                            />
                          ) : isAboutPage ? (
                            <AboutInlinePreview
                              content={aboutPreviewContent}
                              globals={globals}
                              onSelectEdit={handleInlineSelect}
                              onChangeContent={setContentDirty}
                            />
                          ) : (
                            <InlinePreview
                              content={content}
                              globals={globals}
                              onChangeContent={setContentDirty}
                              onChangeGlobals={setGlobals}
                              activeEdit={inlineEditTarget}
                              onSelectEdit={handleInlineSelect}
                              mode={previewMode}
                              layout="viewport"
                              showChips={showInlineChips}
                            />
                          )}
                        </HomePageShell>
                      </div>
                    )}
                  </div>
                  <div className="mx-6 rounded-[48px] border border-stone-200 bg-white/80 p-6 shadow-xl shadow-amber-900/10">
                    <div className="relative z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
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
                        onClick={() => {
                          void saveDraft().catch(handleAsyncError);
                        }}
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
                      onClick={() => {
                        void saveDraft().catch(handleAsyncError);
                      }}
                    >
                      Save draft
                    </button>
                    <button
                      className="rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold"
                      onClick={() => void createDraftFromPublished().catch(handleAsyncError)}
                    >
                      Create draft from published
                    </button>
                    <button
                      className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
                      onClick={() => void publish().catch(handleAsyncError)}
                    >
                      Publish
                    </button>
                </section>
              )}

              {panel === "history" && (
                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                        History
                      </p>
                      <p className="text-sm text-stone-600">
                        Snapshots are saved on manual save, publish, and 15-minute autosaves.
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                      onClick={() => void loadHistory().catch(handleAsyncError)}
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Page: /{activePageSlug}
                      </h3>
                      {currentPublishedPage ? (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                Published
                              </p>
                              <p className="mt-1 text-sm text-emerald-900">
                                This is the current live version.
                                {!publishedPageMatchId ? " (Not in history yet)" : ""}
                              </p>
                            </div>
                            <button
                              className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                              onClick={() => {
                                if (!publishedPageMatchId) return;
                                const node = document.getElementById(
                                  `history-page-${publishedPageMatchId}`
                                );
                                node?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              disabled={!publishedPageMatchId}
                            >
                              Go to version
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {historyLoading ? (
                        <p className="text-sm text-stone-500">Loading...</p>
                      ) : pageHistory.length ? (
                        pageHistory.map((entry) => {
                          const isPublished = publishedPageMatchId === entry.id;
                          return (
                            <div
                              key={entry.id}
                              id={`history-page-${entry.id}`}
                                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-stone-900">
                                      {new Date(entry.created_at).toLocaleString()}
                                    </p>
                                    {historyChipForSource(entry.source)}
                                  </div>
                                  {isPublished ? (
                                    <p className="text-xs font-semibold text-emerald-600">
                                      Currently published
                                    </p>
                                  ) : (
                                    <p className="text-xs text-stone-500">Draft snapshot</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold"
                                    onClick={() => {
                                      setContentDirty(entry.draft);
                                      setStatus("Loaded snapshot into editor.");
                                    }}
                                  >
                                    Load draft
                                  </button>
                                  <button
                                    className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white"
                                    onClick={async () => {
                                      setStatus("Publishing snapshot...");
                                      await publishWithPayload(entry.draft, globals, {
                                        updateDraft: false,
                                      });
                                    }}
                                  >
                                    Publish this
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-stone-500">No history yet.</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Global settings
                      </h3>
                      {currentPublishedGlobals ? (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                Published
                              </p>
                              <p className="mt-1 text-sm text-emerald-900">
                                This is the current live settings version.
                                {!publishedGlobalsMatchId ? " (Not in history yet)" : ""}
                              </p>
                            </div>
                            <button
                              className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                              onClick={() => {
                                if (!publishedGlobalsMatchId) return;
                                const node = document.getElementById(
                                  `history-global-${publishedGlobalsMatchId}`
                                );
                                node?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              disabled={!publishedGlobalsMatchId}
                            >
                              Go to version
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {historyLoading ? (
                        <p className="text-sm text-stone-500">Loading...</p>
                      ) : globalHistory.length ? (
                        globalHistory.map((entry) => {
                          const isPublished = publishedGlobalsMatchId === entry.id;
                          return (
                            <div
                              key={entry.id}
                              id={`history-global-${entry.id}`}
                                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-stone-900">
                                      {new Date(entry.created_at).toLocaleString()}
                                    </p>
                                    {historyChipForSource(entry.source)}
                                  </div>
                                  {isPublished ? (
                                    <p className="text-xs font-semibold text-emerald-600">
                                      Currently published
                                    </p>
                                  ) : (
                                    <p className="text-xs text-stone-500">Draft snapshot</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold"
                                    onClick={() => {
                                      setGlobals(entry.draft);
                                      setStatus("Loaded settings snapshot.");
                                    }}
                                  >
                                    Load settings
                                  </button>
                                  <button
                                    className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white"
                                    onClick={async () => {
                                      setStatus("Publishing settings snapshot...");
                                      await publishWithPayload(content, entry.draft, {
                                        updateDraft: false,
                                      });
                                    }}
                                  >
                                    Publish this
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-stone-500">No history yet.</p>
                      )}
                    </div>
                  </div>
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
