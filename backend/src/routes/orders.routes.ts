import { Router } from 'express';
import Order, { generateReference, ORDER_STATUSES } from '../models/Order.model';
import Product from '../models/Product.model';
import { HttpError, handler, notFound } from '../lib/http';
import { shippingFor } from '../lib/shipping';
import { authenticate, optionalAuth, requirePermission } from '../middlewares/auth';
import { createOrderSchema, updateOrderSchema } from '../validators/orders';

const router = Router();

const requireShop = requirePermission('orders:manage');

router.post(
  '/',
  optionalAuth,
  handler(async (req, res) => {
    const value = await createOrderSchema.validateAsync(req.body, { stripUnknown: true });

    const ids = value.items.map((item: { product_id: string }) => item.product_id);
    const products = await Product.find({ _id: { $in: ids } });
    const byId = new Map(products.map((product) => [String(product._id), product]));

    const items = value.items.map((line: { product_id: string; size: string; quantity: number }) => {
      const product = byId.get(line.product_id);

      if (!product || product.isVisible === false) {
        throw new HttpError(409, "Un article du panier n'est plus disponible", [
          product ? `${product.name} a été retiré de la boutique` : 'Article introuvable',
        ]);
      }
      if (!product.inStock) {
        throw new HttpError(409, "Un article du panier n'est plus disponible", [
          `${product.name} est en rupture`,
        ]);
      }

      return {
        product: product._id,
        name: product.name,
        unit_price: product.price,
        size: line.size,
        quantity: line.quantity,
      };
    });

    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );
    const shipping = shippingFor(subtotal, value.fulfilment);

    const order = await Order.create({
      reference: generateReference(),
      customer: {
        name: value.customer.name,
        phone: value.customer.phone,
        email: value.customer.email || undefined,
      },
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      fulfilment: value.fulfilment,
      address: value.address || undefined,
      payment_method: value.payment_method,
      note: value.note || undefined,
      placed_by: req.auth?.userId,
    });

    res.status(201).json({ success: true, data: order });
  })
);

router.get(
  '/',
  authenticate,
  requireShop,
  handler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const query: Record<string, unknown> = {};

    if (typeof req.query.status === 'string' && ORDER_STATUSES.includes(req.query.status as never)) {
      query.status = req.query.status;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ reference: pattern }, { 'customer.name': pattern }, { 'customer.phone': pattern }];
    }

    const [items, total] = await Promise.all([
      Order.find(query).sort('-created_at').skip((page - 1) * limit).limit(limit),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  '/:id',
  authenticate,
  requireShop,
  handler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw notFound('Commande introuvable');
    res.json({ success: true, data: order });
  })
);

router.put(
  '/:id',
  authenticate,
  requireShop,
  handler(async (req, res) => {
    const value = await updateOrderSchema.validateAsync(req.body, { stripUnknown: true });

    const order = await Order.findById(req.params.id);
    if (!order) throw notFound('Commande introuvable');

    if (value.status !== undefined) order.status = value.status;
    if (value.note !== undefined) order.note = value.note;
    await order.save();

    res.json({ success: true, data: order });
  })
);

export default router;
