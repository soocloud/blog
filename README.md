# SooBlog

Personal tech blog by **Dongsoo** — built with [Astro](https://astro.build/) +
[AstroPaper](https://github.com/satnaing/astro-paper) v5.5.1,
deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

Posts are mainly in English, with occasional Korean / Japanese entries.

---

## 로컬 개발

```powershell
npm install        # 최초 1회
npm run dev        # http://localhost:4321
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 미리보기
```

> Node.js **22.12+** 필요.

## 글 작성

새 글은 `src/data/blog/<slug>.md` (또는 `.mdx`)로 추가합니다.

```markdown
---
author: Dongsoo
pubDatetime: 2026-05-23T10:00:00+09:00
title: 제목
slug: url-slug         # 파일명과 일치시키는 게 가장 깔끔
featured: false         # 메인 상단 노출 여부
draft: false            # true면 빌드에서 제외
tags:
  - tag1
  - tag2
description: 1~2줄 요약. OG/카드 등에 노출.
---

본문…
```

### 언어 표시 (Korean / Japanese)

기본 언어는 `en`. 한국어/일본어 글은 태그로 구분합니다.

- `tags: [ko, ...]` → 한국어 글
- `tags: [ja, ...]` → 일본어 글
- 태그 외에 본문 첫 줄에 언어 배지를 적어두면 검색·아카이브에서 알아보기 쉬움

> 정식 i18n 라우팅(`/ko/`, `/ja/`)이 필요해지면 그때 추가합니다.

## 설정 위치

| 파일 | 내용 |
|---|---|
| `src/config.ts` | 사이트 제목 / 작성자 / 설명 / 기본 언어 / 타임존 |
| `src/constants.ts` | 헤더·푸터 소셜 링크 |
| `src/pages/about.md` | About 페이지 |
| `astro.config.ts` | Astro / Vite / 마크다운 플러그인 |
| `public/` | 정적 파일 (favicon, OG 이미지 등) |

### TODO (배포 후)

- [ ] `src/config.ts` 의 `website` 를 실제 Cloudflare Pages URL로 교체
- [ ] `src/constants.ts` Mail 주소를 실제 이메일로 교체
- [ ] `public/astropaper-og.jpg` 를 본인 OG 이미지로 교체
- [ ] (선택) `favicon.svg`, `favicon.ico` 교체

## 배포 (Cloudflare Pages)

1. GitHub 저장소 [`soocloud/blog`](https://github.com/soocloud/blog) 에 푸시
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
3. 저장소 선택 후 빌드 설정:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: `22` (환경 변수 `NODE_VERSION=22`)
4. Deploy → 자동으로 `*.pages.dev` 도메인 발급
5. 이후 `main` 브랜치에 push 하면 자동 재배포

## 라이선스 / 크레딧

- 테마: [AstroPaper](https://github.com/satnaing/astro-paper) by Sat Naing (MIT)
- 글 콘텐츠: © Dongsoo. 별도 표기 없는 한 무단 전재 금지.
