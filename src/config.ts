export const SITE = {
  website: "https://sooblog.pages.dev/",
  author: "Dongsoo",
  profile: "https://github.com/soocloud",
  desc: "클라우드·AI·웹 개발에 대한 긴 글과 도표 모음 (KO / EN / JA)",
  title: "SooBlog",
  ogImage: "astropaper-og.jpg", // TODO: 본인 OG 이미지로 교체 (public/ 폴더)
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/soocloud/blog/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Tokyo",
} as const;
