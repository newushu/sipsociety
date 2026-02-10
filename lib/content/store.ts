import {
  defaultAboutContent,
  defaultCareerContent,
  defaultContent,
  defaultGlobals,
  defaultGalleryContent,
  defaultMenuContent,
} from "./defaults";
import { GlobalSettings, PageContent } from "./types";
import { createServerClient } from "@/lib/supabase/server";

const defaultContentBySlug = (slug: string) => {
  if (slug === "menu") return defaultMenuContent;
  if (slug === "gallery") return defaultGalleryContent;
  if (slug === "career") return { ...defaultContent, career: defaultCareerContent };
  if (slug === "about-us" || slug === "aboutus")
    return { ...defaultContent, about: defaultAboutContent };
  return defaultContent;
};

const normalizeContent = (
  content: PageContent | null | undefined,
  slug: string
): PageContent => {
  const fallback = defaultContentBySlug(slug);
  if (!content) return fallback;
  if (!content.blocks?.length) {
    if (slug === "gallery" || slug === "career" || slug === "about-us" || slug === "aboutus") {
      return { ...fallback, ...content };
    }
    return fallback;
  }
  const allowedTypes = new Set(
    [...defaultContent.blocks, ...defaultMenuContent.blocks].map((block) => block.type)
  );
  const hasUnknown = content.blocks.some((block) => !allowedTypes.has(block.type));
  if (hasUnknown) return fallback;
  return content;
};

const normalizeGlobals = (
  globals: GlobalSettings | null | undefined
): GlobalSettings => {
  if (!globals) return defaultGlobals;
  return { ...defaultGlobals, ...globals };
};

export const getPublishedContent = async (
  slug: string = "home"
): Promise<PageContent> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("published_pages")
      .select("content")
      .eq("slug", slug)
      .single();

    if (error || !data?.content) {
      return defaultContentBySlug(slug);
    }

    return normalizeContent(data.content as PageContent, slug);
  } catch (error) {
    return defaultContentBySlug(slug);
  }
};

export const getPublishedContentOrNull = async (
  slug: string
): Promise<PageContent | null> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("published_pages")
      .select("content")
      .eq("slug", slug)
      .single();

    if (error || !data?.content) {
      // Some older records may have stored a leading slash in the slug.
      const altSlug = slug.startsWith("/") ? slug.slice(1) : `/${slug}`;
      const { data: altData, error: altError } = await supabase
        .from("published_pages")
        .select("content")
        .eq("slug", altSlug)
        .single();
      if (altError || !altData?.content) {
        return null;
      }
      return normalizeContent(altData.content as PageContent, slug);
    }

    return normalizeContent(data.content as PageContent, slug);
  } catch (error) {
    return null;
  }
};

export const getPublishedGlobals = async (): Promise<GlobalSettings> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("published_global_settings")
      .select("content")
      .eq("key", "site")
      .single();

    if (error || !data?.content) {
      return defaultGlobals;
    }

    return normalizeGlobals(data.content as GlobalSettings);
  } catch (error) {
    return defaultGlobals;
  }
};
