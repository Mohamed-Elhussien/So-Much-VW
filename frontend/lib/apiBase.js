// ⚡ عنوان الـ API للطلبات اللي بتتبعت من المتصفح. NEXT_PUBLIC_* بيتدمج وقت الـ build،
// فلو اتنسى في Vercel لازم نفشل بوضوح بدل ما نبعت لـ localhost أو لنفس الدومين بالغلط.
const fromEnv = process.env.NEXT_PUBLIC_API_URL
export const API_BASE = fromEnv ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000')
