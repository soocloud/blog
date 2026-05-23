import type { CollectionEntry } from "astro:content";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/content.config";
import postFilter from "./postFilter";

interface CategoryInfo {
  category: Category;
  label: string;
  count: number;
}

/**
 * Returns every category that has at least one published post,
 * ordered the same way as CATEGORIES is declared in content.config.ts.
 */
const getUniqueCategories = (
  posts: CollectionEntry<"blog">[]
): CategoryInfo[] => {
  const published = posts.filter(postFilter);
  const counts = new Map<Category, number>();
  for (const post of published) {
    const c = post.data.category;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return CATEGORIES.filter(c => counts.has(c)).map(c => ({
    category: c,
    label: CATEGORY_LABELS[c],
    count: counts.get(c) ?? 0,
  }));
};

export default getUniqueCategories;
