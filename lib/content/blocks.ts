import { BlockType, ContentBlock } from "./types";
import { defaultContent, defaultMenuContent } from "./defaults";

const templatesByType: Record<BlockType, ContentBlock> = Object.fromEntries(
  [...defaultContent.blocks, ...defaultMenuContent.blocks].map((block) => [
    block.type,
    block,
  ])
) as Record<BlockType, ContentBlock>;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Math.random().toString(16).slice(2)}`;
};

export const createBlock = (type: BlockType): ContentBlock => {
  const template = templatesByType[type];
  return {
    ...template,
    id: createId(),
    data: JSON.parse(JSON.stringify(template.data)),
  };
};

export const blockTypes: { label: string; value: BlockType }[] = [
  { label: "Hero", value: "hero" },
  { label: "Brand Message", value: "brand-message" },
  { label: "Triple Media", value: "triple-media" },
  { label: "Landscape", value: "landscape" },
  { label: "Footer", value: "footer" },
  { label: "Menu", value: "menu" },
];
