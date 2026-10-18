const express = require('express')
const rateLimit = require('express-rate-limit')
const Order = require('../models/Order')
const Product = require('../models/Product')
const { woo } = require('../lib/woo')
const { validateOrderInput, isValidKey } = require('../validators/orderInput')
const { createOrderService, OrderError } = require('../services/orderService')

const router = express.Router()

const orderService = createOrderService({
  Order,
  Product,
  woo,
  config: {
    shippingFee: process.env.SHIPPING_FEE ?? 60, // لازم يطابق SHIPPING_FEE في checkout (مؤقتًا)
    orderStatus: process.env.WC_ORDER_STATUS ?? 'processing',
  },
})

// ⚡ حماية من السبام/الإساءة: 10 محاولات كل 10 دقايق لكل IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many order attempts. Please try again in a few minutes.', code: 'RATE_LIMITED' },
})

// حالة أوردر (للفرونت لما الرد يضيع). حد أوسع لأنه بيتنادى بالـ polling.
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests.', code: 'RATE_LIMITED' },
})

router.get('/status/:key', statusLimiter, async (req, res, next) => {
  if (!isValidKey(req.params.key)) {
    return res.status(400).json({ error: 'Invalid request key.', code: 'VALIDATION' })
  }
  try {
    res.set('Cache-Control', 'no-store')
    res.json(await orderService.getStatus(req.params.key))
  } catch (err) {
    next(err)
  }
})

router.post('/', limiter, async (req, res, next) => {
  const parsed = validateOrderInput(req.body)
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Please check your details.', code: 'VALIDATION', fields: parsed.errors })
  }

  try {
    const result = await orderService.createOrder(parsed.data)
    return res.status(result.replayed ? 200 : 201).json({ orderNumber: result.orderNumber, total: result.total })
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.status).json({ error: err.message, code: err.code, ...(err.details ? { items: err.details } : {}) })
    }
    next(err) // أي خطأ غير متوقع → errorHandler (500 عام من غير تسريب تفاصيل)
  }
})

module.exports = router
