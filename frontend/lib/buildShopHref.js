import { slugify } from '@/lib/slugify'

// ⚡ مكان واحد بيبني كل روابط صفحة /shop — الـ Navbar، الـ mega menu،
// سيكشن الـ Categories في الهوم، كل حاجة بتنادي الدالة دي بدل ما كل
// مكان يبني الـ query string بإيده (ومن غير ما ننسى نعمل slugify
// لأي جزء من غير قصد).
export function buildShopHref({ department, category, brand, search } = {}) {
  const params = new URLSearchParams()
  if (department) params.set('department', slugify(department))
  if (category) params.set('category', slugify(category))
  if (brand) params.set('brand', slugify(brand))
  if (search) params.set('search', search)

  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}
