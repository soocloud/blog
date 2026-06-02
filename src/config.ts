export const SITE = {
  website: "https://sooblog.pages.dev/",
  author: "Dongsoo",
  profile: "https://github.com/soocloud",
  desc: "Dongsoo's tech blog about cloud, and software engineering.",
  title: "SooBlog",
  ogImage: "astropaper-og.jpg", 
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 6,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/soocloud/blog/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Tokyo",
} as const;
