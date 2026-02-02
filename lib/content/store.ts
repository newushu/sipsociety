import { defaultContent, defaultGlobals } from "./defaults";
import { GlobalSettings, PageContent } from "./types";
import { createServerClient } from "@/lib/supabase/server";

const normalizeContent = (content: PageContent | null | undefined): PageContent => {
  if (!content || !content.blocks?.length) {
    return defaultContent;
  }
  const allowedTypes = new Set(defaultContent.blocks.map((block) => block.type));
  const hasUnknown = content.blocks.some((block) => !allowedTypes.has(block.type));
  if (hasUnknown) return defaultContent;
  return content;
};

const normalizeGlobals = (
  globals: GlobalSettings | null | undefined
): GlobalSettings => {
  if (!globals) return defaultGlobals;
  return { ...defaultGlobals, ...globals };
};

export const getPublishedContent = async (): Promise<PageContent> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("published_pages")
      .select("content")
      .eq("slug", "home")
      .single();

    if (error || !data?.content) {
      return defaultContent;
    }

    return normalizeContent(data.content as PageContent);
  } catch (error) {
    return defaultContent;
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
