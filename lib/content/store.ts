import { defaultContent, defaultGlobals, defaultMenuContent } from "./defaults";
import { GlobalSettings, PageContent } from "./types";
import { createServerClient } from "@/lib/supabase/server";

const defaultContentBySlug = (slug: string) =>
  slug === "menu" ? defaultMenuContent : defaultContent;

const normalizeContent = (
  content: PageContent | null | undefined,
  slug: string
): PageContent => {
  const fallback = defaultContentBySlug(slug);
  if (!content || !content.blocks?.length) {
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
