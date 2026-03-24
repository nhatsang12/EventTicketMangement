import { useEffect, useRef } from 'react';
import axios from 'axios';

import API_URL from '../config/api';
import useAuthStore from '../store/authStore';
import {
  QUICK_RELEASE_TIMEOUT_MS,
  STUCK_PAYMENT_TIMEOUT_MS,
  clearPendingOrderTracking,
  extractOrderId,
  findOrderInListById,
  getOrderAgeMs,
  getTrackedPendingOrders,
  recordCancelAttemptForTrackedOrder,
} from '../utils/pendingOrderTimeout.js';

const QUICK_SCAN_INTERVAL_MS = 5000;
const STALE_SCAN_INTERVAL_MS = 60000;

const normalizeStatus = (status) => String(status || '').toLowerCase();

const parseOrders = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const isResolvedState = (status) => {
  const s = normalizeStatus(status);
  return s !== 'pending' && s !== '';
};

const createCancelAttempts = (orderId, reason) => [
  { method: 'post', url: `${API_URL}/api/orders/cancel`, data: { orderId, reason } },
  { method: 'post', url: `${API_URL}/api/orders/${orderId}/cancel`, data: { reason } },
  { method: 'patch', url: `${API_URL}/api/orders/${orderId}/cancel`, data: { reason } },
  { method: 'put', url: `${API_URL}/api/orders/${orderId}/cancel`, data: { reason } },
  { method: 'patch', url: `${API_URL}/api/orders/${orderId}/status`, data: { status: 'cancelled', reason } },
];

const requestByMethod = async (attempt, config) => {
  if (attempt.method === 'post') return axios.post(attempt.url, attempt.data, config);
  if (attempt.method === 'patch') return axios.patch(attempt.url, attempt.data, config);
  if (attempt.method === 'put') return axios.put(attempt.url, attempt.data, config);
  throw new Error(`Unsupported method: ${attempt.method}`);
};

const tryCancelPendingOrder = async (orderId, token, reason) => {
  const id = extractOrderId({ _id: orderId });
  if (!id || !token) return false;

  const config = { headers: { Authorization: `Bearer ${token}` } };
  const attempts = createCancelAttempts(id, reason);

  for (const attempt of attempts) {
    try {
      await requestByMethod(attempt, config);
      return true;
    } catch (error) {
      const status = error?.response?.status;
      const errorText = JSON.stringify(error?.response?.data || '').toLowerCase();
      const alreadyResolved =
        errorText.includes('paid') ||
        errorText.includes('completed') ||
        errorText.includes('not pending') ||
        errorText.includes('đã thanh toán');
      if (alreadyResolved) return true;

      const retryable = [400, 404, 405, 409, 422].includes(status);
      if (!retryable) break;
    }
  }

  return false;
};

const usePendingOrderCleanup = () => {
  const token = useAuthStore((state) => state.accessToken || state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const runningRef = useRef(false);
  const lastStaleScanAtRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    let isMounted = true;

    const cleanupPendingOrders = async () => {
      if (!isMounted || runningRef.current) return;
      runningRef.current = true;

      try {
        const now = Date.now();
        const trackedOrders = getTrackedPendingOrders();
        const shouldStaleScan = now - lastStaleScanAtRef.current >= STALE_SCAN_INTERVAL_MS;

        if (trackedOrders.length === 0 && !shouldStaleScan) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/api/orders/my-orders`, config);
        const orders = parseOrders(response?.data);

        for (const tracked of trackedOrders) {
          const order = findOrderInListById(orders, tracked.orderId);
          if (!order) {
            clearPendingOrderTracking(tracked.orderId);
            continue;
          }

          const status = normalizeStatus(order?.status);
          if (isResolvedState(status)) {
            clearPendingOrderTracking(tracked.orderId);
            continue;
          }

          const quickExpired = now >= tracked.shortExpireAt;
          const hardExpired = now >= tracked.hardExpireAt;
          if (!quickExpired && !hardExpired) continue;

          // Avoid spamming cancel endpoint for the same pending order.
          const canRetryCancel = now - (tracked.lastCancelAttemptAt || 0) >= QUICK_RELEASE_TIMEOUT_MS;
          if (!canRetryCancel) continue;

          const reason = quickExpired ? 'unpaid_after_30_seconds' : 'pending_over_15_minutes';
          const cancelled = await tryCancelPendingOrder(extractOrderId(order) || tracked.orderId, token, reason);
          recordCancelAttemptForTrackedOrder(tracked.orderId);
          if (cancelled) clearPendingOrderTracking(tracked.orderId);
        }

        if (shouldStaleScan) {
          lastStaleScanAtRef.current = now;

          const stalePendingOrders = orders.filter((order) => {
            const status = normalizeStatus(order?.status);
            return status === 'pending' && getOrderAgeMs(order, now) >= STUCK_PAYMENT_TIMEOUT_MS;
          });

          for (const staleOrder of stalePendingOrders) {
            const staleOrderId = extractOrderId(staleOrder);
            if (!staleOrderId) continue;
            const cancelled = await tryCancelPendingOrder(staleOrderId, token, 'pending_over_15_minutes');
            if (cancelled) clearPendingOrderTracking(staleOrderId);
          }
        }
      } catch {
        // silent cleanup worker
      } finally {
        runningRef.current = false;
      }
    };

    cleanupPendingOrders();
    const intervalId = window.setInterval(cleanupPendingOrders, QUICK_SCAN_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, token]);
};

export default usePendingOrderCleanup;
