/** @type {import('next').NextConfig} */

// ⚡ دومينات الصور المسموحة لـ next/image. السبب: لو مفتوحة لأي دومين ('**') أي حد يقدر يستخدم الـ
// image optimizer بتاعك على Vercel لأي صورة في الإنترنت (تكلفة وإساءة استخدام).
//
// القايمة = الدومينات الافتراضية (دومين المتجر) + أي دومينات إضافية في IMAGE_HOSTS (مفصولة بفاصلة).
// ⚠️ IMAGE_HOSTS بتضيف على الافتراضي، مش بتستبدله: غلطة في القيمة ما تكسرش صور المتجر.
// أي تعديل هنا أو في .env.local محتاج إعادة تشغيل `npm run dev`.
const DEFAULT_IMAGE_HOSTS = [
  'somuchstores.com', // الدومين الرئيسي
  '**.somuchstores.com', // أي subdomain: test1.somuchstores.com، cdn.somuchstores.com...
]

// بننضّف القيمة لو اتلصق فيها https:// أو / في الآخر أو مسافات
const clean = (h) => h.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')

const extraHosts = (process.env.IMAGE_HOSTS || '').split(',').map(clean).filter(Boolean)
const imageHosts = [...new Set([...DEFAULT_IMAGE_HOSTS, ...extraHosts])]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https', hostname })),
    // صور المنتجات نادرًا بتتغيّر ← كاش شهر، يقلّل شغل الـ optimizer (والتكلفة)
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
