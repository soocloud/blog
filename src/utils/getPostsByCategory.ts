import type { CollectionEntry } from "astro:content";
import type { Category } from "@/content.config";
import getSortedPosts from "./getSortedPosts";

const getPostsByCategory = (
  posts: CollectionEntry<"blog">[],
  category: Category
) => getSortedPosts(posts.filter(post => post.data.category === category));

export default getPostsByCategory;
