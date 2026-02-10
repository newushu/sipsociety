import { MenuBlock, MenuItem, MenuSection } from "./types";

const spacing = 64;
const detailOffset = 20;
const defaultPriceX = 220;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const ensureSectionId = (section: MenuSection, index: number) =>
  section.id && section.id.trim().length
    ? section.id
    : `menu-${slugify(section.title) || `section-${index + 1}`}`;

const ensureItemId = (sectionId: string, item: MenuItem, index: number) =>
  item.id && item.id.trim().length ? item.id : `${sectionId}-${index + 1}`;

export const normalizeMenuBlock = (
  block: MenuBlock
): { block: MenuBlock; changed: boolean } => {
  let changed = false;
  const sections = block.data.sections.map((section, sectionIndex) => {
    const sectionId = ensureSectionId(section, sectionIndex);
    if (sectionId !== section.id) changed = true;
    const items = section.items.map((item, itemIndex) => {
      const id = ensureItemId(sectionId, item, itemIndex);
      if (id !== item.id) changed = true;
      const baseY = itemIndex * spacing;
      const namePos = item.namePos ?? { x: 0, y: baseY };
      const detailPos = item.detailPos ?? { x: 0, y: baseY + detailOffset };
      const pricePos = item.pricePos ?? { x: defaultPriceX, y: baseY };
      if (!item.namePos || !item.detailPos || !item.pricePos) changed = true;
      return {
        ...item,
        id,
        namePos,
        detailPos,
        pricePos,
        showPrice: item.showPrice ?? true,
      };
    });
    return { ...section, id: sectionId, items };
  });

  if (block.data.showPrices === undefined) changed = true;

  return {
    block: {
      ...block,
      data: {
        ...block.data,
        showPrices: block.data.showPrices ?? true,
        sections,
      },
    },
    changed,
  };
};
