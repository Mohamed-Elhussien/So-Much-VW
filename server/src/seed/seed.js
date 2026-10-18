require('dotenv').config()

// ⚡ FORCE_GOOGLE_DNS (لو محتاجه) بيتقرا جوه db.js نفسه — مش محتاجين
// نكرره هنا، وده كمان بيضمن إن أي مكان بينادي connectDB() (السيرفر أو
// سكريبت السييد) بيتصرف بنفس الطريقة بالظبط من غير تكرار كود.
const connectDB = require('../db')
const Product = require('../models/Product')
const products = require('./products.seed.json')
const { getContentByCategory } = require('./contentTemplates')

async function seed() {
  await connectDB()

  await Product.deleteMany({})
  console.log('🗑️  Old products cleared')

  // ⚡ ملحوظة: id (الرقم البسيط) مش هنستخدمه في MongoDB — كل منتج
  // هياخد _id تلقائي من MongoDB نفسه (ObjectId)، فبنشيله هنا.
  //
  // ⚡ بندمج قالب المحتوى بتاع الـ category (keyBenefits/howToUse/
  // suitableFor/specifications/faq) مع كل منتج — لو المنتج نفسه فيه
  // قيمة مخصصة لأي حقل من دول في الملف الأصلي، بتفضل هي الأساس
  // (الـ spread بتاع rest جاي بعد القالب)، والقالب بيغطي بس الحقول
  // الناقصة.
  const docs = products.map(({ id, ...rest }) => ({
    ...getContentByCategory(rest.category),
    ...rest,
  }))

  // ⚡ بنستخدم create() بدل insertMany() عمدًا: insertMany بيتخطى
  // pre('save') middleware، يعني slug/brandSlug/customTagSlug مكنوش
  // هيتحسبوا خالص. create() بيعمل .save() لكل document لوحده فبيشغّل
  // الـ hook — التكلفة الإضافية مش مهمة هنا لأنه سكريبت تشغيل مرة
  // واحدة على 16 منتج بس، مش endpoint بيتنادى كتير.
  const created = await Product.create(docs)
  console.log(`✅ ${created.length} products seeded successfully`)

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
