import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Package, Phone, Search, Store, Truck } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { formatCFA } from '../../lib/currency';
import { formatDateTime } from '../../lib/dates';
import { Order, ORDER_STATUSES, OrderStatus } from '../../types';
import {
  FULFILMENT_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
  listOrders,
  updateOrder,
} from '../../services/site/orders.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';

const STATUS_BADGE: Record<OrderStatus, string> = {
  recue: 'bg-club-yellow text-black',
  preparee: 'bg-blue-500/20 text-blue-200',
  remise: 'bg-club-green text-white',
  annulee: 'bg-red-500/20 text-red-200',
};

const Commandes: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        setOrders(await listOrders({ search, status: statusFilter }, signal));
      } catch (cause) {
        if (cause instanceof ApiError) setError(cause);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const counts = useMemo(() => {
    const byStatus = {} as Record<OrderStatus, number>;
    orders.forEach((order) => {
      byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    });
    return byStatus;
  }, [orders]);

  const revenue = useMemo(
    () => orders.filter((order) => order.status !== 'annulee').reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setError(null);
    try {
      const updated = await updateOrder(order.id, { status });
      setOrders((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (cause) {
      if (cause instanceof ApiError) setError(cause);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Package size={20} className="text-club-yellow" />
            Commandes
          </h2>
          <p className="text-sm text-white/60">
            {orders.length} commande{orders.length > 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-club-yellow">{formatCFA(revenue)}</span> hors annulations
          </p>
        </div>
      </div>

      <AdminError error={error} onRetry={() => void load()} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <label htmlFor="order-search" className="sr-only">Rechercher une commande</label>
          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Référence, nom ou téléphone"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-club-yellow"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition-colors ${
              statusFilter === '' ? 'bg-club-yellow text-black' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
            }`}
          >
            Toutes
          </button>
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition-colors ${
                statusFilter === status
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
              }`}
            >
              {STATUS_LABELS[status]}
              {counts[status] ? ` (${counts[status]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <AdminLoading label="Chargement des commandes…" />
      ) : orders.length === 0 ? (
        <AdminEmpty
          label={
            search || statusFilter
              ? 'Aucune commande ne correspond'
              : 'Aucune commande pour le moment'
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-club-yellow">{order.reference}</p>
                      <p className="truncate text-sm font-semibold text-white">{order.customer.name}</p>
                      <p className="flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {order.customer.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          {order.fulfilment === 'retrait' ? <Store size={11} /> : <Truck size={11} />}
                          {FULFILMENT_LABELS[order.fulfilment]}
                        </span>
                        <span className="hidden sm:inline">{formatDateTime(order.created_at)}</span>
                      </p>
                    </div>
                  </button>

                  <div className="text-right">
                    <p className="font-extrabold text-white">{formatCFA(order.total)}</p>
                    <p className="text-xs text-white/40">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                    </p>
                  </div>

                  <label className="sr-only" htmlFor={`status-${order.id}`}>
                    Statut de la commande {order.reference}
                  </label>
                  <select
                    id={`status-${order.id}`}
                    value={order.status}
                    onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase outline-none ${STATUS_BADGE[order.status]}`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-graphite text-white">
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {isOpen && (
                  <div className="grid gap-6 border-t border-white/10 bg-black/20 p-5 lg:grid-cols-[1fr_280px]">
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-white/50">
                        Articles
                      </p>
                      <ul className="space-y-2">
                        {order.items.map((item, index) => (
                          <li
                            key={`${item.name}-${item.size}-${index}`}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-white">{item.name}</span>
                              <span className="text-xs text-white/50">
                                Taille {item.size || '—'} · ×{item.quantity} ·{' '}
                                {formatCFA(item.unit_price)} l'unité
                              </span>
                            </span>
                            <span className="whitespace-nowrap font-bold text-white">
                              {formatCFA(item.unit_price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {order.note && (
                        <>
                          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-white/50">
                            Précision du client
                          </p>
                          <p className="text-sm text-white/70">{order.note}</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-white/50">Remise</p>
                        <p className="mt-1 text-white">{FULFILMENT_LABELS[order.fulfilment]}</p>
                        {order.address && <p className="text-xs text-white/60">{order.address}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-white/50">Règlement</p>
                        <p className="mt-1 text-white">{PAYMENT_LABELS[order.payment_method]}</p>
                      </div>
                      {order.customer.email && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-white/50">E-mail</p>
                          <p className="mt-1 break-all text-white">{order.customer.email}</p>
                        </div>
                      )}
                      <dl className="space-y-1 border-t border-white/10 pt-3">
                        <div className="flex justify-between">
                          <dt className="text-white/60">Sous-total</dt>
                          <dd>{formatCFA(order.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-white/60">Livraison</dt>
                          <dd>{order.shipping === 0 ? 'Offerte' : formatCFA(order.shipping)}</dd>
                        </div>
                        <div className="flex justify-between font-extrabold text-club-yellow">
                          <dt>Total</dt>
                          <dd>{formatCFA(order.total)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Commandes;
