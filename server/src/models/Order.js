const mongoose = require('mongoose')

// ⚡ سجل داخلي خفيف للأوردرات (مش مصدر الحقيقة: WooCommerce هو المصدر).
// وظايفه: (1) منع تكرار الأوردر لو العميل ضغط مرتين/الشبكة اتقطعت (idempotency)،
// (2) أثر للمراجعة لو حصل غموض مع WooCommerce.
// ⚡ عمدًا مفيهوش بيانات العميل (اسم/تليفون/عنوان): دي بتروح WooCommerce بس.
const lineSchema = new mongoose.Schema(
  {
    productId: String,
    wooId: Number,
    wooVariationId: { type: Number, default: null },
    name: String,
    colorName: { type: String, default: null },
    qty: Number,
    unitPrice: Number,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true },
    payloadHash: { type: String, required: true },
    // creating → sending → (created | failed | unknown)
    //   creating = اتحجز المفتاح وبنتحقق من المنتجات (لسه ما اتبعتش حاجة لـ WooCommerce)
    //   sending  = بنكلّم WooCommerce دلوقتي (لو السيرفر وقع هنا: ممكن الأوردر اتعمل!)
    //   failed  = WooCommerce رفض صراحة (4xx) → آمن نعيد المحاولة
    //   unknown = timeout/شبكة/5xx → ممكن الأوردر اتعمل → ما نعيدش تلقائيًا (خطر تكرار)
    status: { type: String, enum: ['creating', 'sending', 'created', 'failed', 'unknown'], default: 'creating' },
    wooOrderId: { type: Number, default: null },
    orderNumber: { type: String, default: null },
    total: { type: Number, default: null },
    items: [lineSchema],
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
)

// حذف تلقائي بعد 180 يوم (data minimization)
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 })

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema)
