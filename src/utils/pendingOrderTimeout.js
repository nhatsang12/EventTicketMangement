export const QUICK_RELEASE_TIMEOUT_MS = 30 * 1000;
export const STUCK_PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

const TRACKING_STORAGE_KEY = 'pending-payment-order-trackers';

const normalizeId = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const toMs = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const readTrackers = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        const now = Date.now();
        const orderId = normalizeId(entry?.orderId);
        const createdAt = toMs(entry?.createdAt, now);
        return {
          orderId,
          createdAt,
          shortExpireAt: toMs(entry?.shortExpireAt, now + QUICK_RELEASE_TIMEOUT_MS),
          hardExpireAt: toMs(entry?.hardExpireAt, createdAt + STUCK_PAYMENT_TIMEOUT_MS),
          lastCancelAttemptAt: toMs(entry?.lastCancelAttemptAt, 0),
          cancelAttempts: Number.isFinite(Number(entry?.cancelAttempts))
            ? Number(entry.cancelAttempts)
            : 0,
        };
      })
      .filter((entry) => entry.orderId);
  } catch {
    return [];
  }
};

const writeTrackers = (entries) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // no-op
  }
};

export const getTrackedPendingOrders = () => readTrackers();

export const trackPendingOrder = (orderId, createdAtInput) => {
  const id = normalizeId(orderId);
  if (!id) return;

  const trackers = readTrackers();
  const now = Date.now();
  const createdAt = toMs(createdAtInput, now);
  const next = {
    orderId: id,
    createdAt,
    shortExpireAt: now + QUICK_RELEASE_TIMEOUT_MS,
    hardExpireAt: createdAt + STUCK_PAYMENT_TIMEOUT_MS,
    lastCancelAttemptAt: 0,
    cancelAttempts: 0,
  };

  const idx = trackers.findIndex((entry) => entry.orderId === id);
  if (idx >= 0) trackers[idx] = { ...trackers[idx], ...next };
  else trackers.push(next);
  writeTrackers(trackers);
};

export const clearPendingOrderTracking = (orderId) => {
  const id = normalizeId(orderId);
  if (!id) return;
  const trackers = readTrackers();
  writeTrackers(trackers.filter((entry) => entry.orderId !== id));
};

export const clearPendingOrderTrackingBatch = (orderIds = []) => {
  const idSet = new Set(orderIds.map(normalizeId).filter(Boolean));
  if (idSet.size === 0) return;
  const trackers = readTrackers();
  writeTrackers(trackers.filter((entry) => !idSet.has(entry.orderId)));
};

export const recordCancelAttemptForTrackedOrder = (orderId) => {
  const id = normalizeId(orderId);
  if (!id) return;
  const trackers = readTrackers();
  const idx = trackers.findIndex((entry) => entry.orderId === id);
  if (idx < 0) return;

  trackers[idx] = {
    ...trackers[idx],
    lastCancelAttemptAt: Date.now(),
    cancelAttempts: (trackers[idx].cancelAttempts || 0) + 1,
  };
  writeTrackers(trackers);
};

export const extractOrderId = (order) => normalizeId(
  order?._id ||
  order?.id ||
  order?.orderId ||
  order?.orderID ||
  order?.orderCode ||
  order?.code
);

export const findOrderInListById = (orders, targetId) => {
  const id = normalizeId(targetId);
  if (!id || !Array.isArray(orders)) return null;

  const lowered = id.toLowerCase();
  return orders.find((order) => {
    const candidates = [
      order?._id,
      order?.id,
      order?.orderId,
      order?.orderID,
      order?.orderCode,
      order?.code,
    ]
      .map(normalizeId)
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    return candidates.includes(lowered);
  }) || null;
};

export const getOrderAgeMs = (order, now = Date.now()) => {
  const createdAt = toMs(order?.createdAt, now);
  return Math.max(0, now - createdAt);
};
