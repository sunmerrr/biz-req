# BizReq — 사업팀 요구사항 -> 프로토타입 자동 생성

## 기술 스택
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4
- Gemini 2.5 Flash / Flash-Lite (@google/genai)
- SQLite (better-sqlite3) + Drizzle ORM 0.45.x

## 시작하기

```bash
cp .env.example .env.local
# GEMINI_API_KEY + HMAC_SECRET 설정
npm install
npx drizzle-kit push
npm run dev
```

## 사용
- 사업팀: 팀 코드 `biz`
- 기획자: 팀 코드 `plan`
