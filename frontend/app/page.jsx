import Hero from '@/components/sections/Hero'
import Categories from '@/components/sections/Categories'
import Offers from '@/components/sections/Offers'
import CategorySection from '@/components/sections/CategorySection'
import WhyUs from '@/components/sections/WhyUs'
import Newsletter from '@/components/sections/Newsletter'
import { MOCK_BRANDS } from '@/data/mockBrands'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Categories />
      <Offers />

      <CategorySection
        title="Make Up"
        categorySlug="makeup"
        brands={MOCK_BRANDS.makeup}
        showBrands
      />
      <CategorySection
        title="Hair & Skin Care"
        categorySlug="hair-and-skin-care"
        brands={MOCK_BRANDS.haircare}
        showBrands
      />
      <CategorySection
        title="Fragrance"
        categorySlug="fragrance"
        brands={MOCK_BRANDS.fragrance}
        showBrands
      />
      <CategorySection
        title="Leather"
        categorySlug="leather"
        showBrands={false}
      />

      <WhyUs />
      <Newsletter />
    </main>
  )
}