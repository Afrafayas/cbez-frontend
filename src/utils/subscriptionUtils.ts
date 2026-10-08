import { Shop } from '../types';

export interface SubscriptionExpiryInfo {
  expiryDate: Date;
  formattedDate: string;
  daysLeft: number;
  daysText: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export function getSubscriptionExpiryInfo(shop: Shop | null | undefined): SubscriptionExpiryInfo {
  const now = new Date();

  if (!shop) {
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      expiryDate: defaultExpiry,
      formattedDate: defaultExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysLeft: 30,
      daysText: '30 days left',
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  // Check explicit end date fields on shop or subscription
  const endCandidate =
    shop.subscription?.endDate ||
    (shop as any).subscriptionEndDate ||
    shop.subscriptionUsage?.endDate ||
    (shop.subscriptionUsage as any)?.expiresAt ||
    (shop as any).subscriptionExpiresAt;

  let expiryDate: Date;

  if (endCandidate && !isNaN(new Date(endCandidate).getTime())) {
    expiryDate = new Date(endCandidate);
  } else {
    // Determine start date
    const startCandidate =
      shop.subscription?.startDate ||
      (shop as any).subscriptionStartDate ||
      (shop as any).createdAt ||
      shop.joinedDate;

    let startDate: Date;
    if (startCandidate && !isNaN(new Date(startCandidate).getTime())) {
      startDate = new Date(startCandidate);
    } else {
      startDate = new Date();
    }

    const durationDays = shop.subscription?.plan?.durationDays || (shop.subscription as any)?.durationDays || 30;
    expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  const diffMs = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.max(-999, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let daysText = `${daysLeft} days left`;
  if (daysLeft < 0) {
    daysText = 'Expired';
  } else if (daysLeft === 0) {
    daysText = 'Expires today';
  } else if (daysLeft === 1) {
    daysText = '1 day left';
  }

  const formattedDate = expiryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    expiryDate,
    formattedDate,
    daysLeft,
    daysText,
    isExpiringSoon: daysLeft <= 5,
    isExpired: daysLeft <= 0,
  };
}

export function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem('mlx_deleted_product_ids');
    const arr = saved ? JSON.parse(saved) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export function addDeletedProductId(id: string | number) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const idStr = String(id);
    const current = getDeletedProductIds();
    current.add(idStr);
    localStorage.setItem('mlx_deleted_product_ids', JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to save deleted product id:', err);
  }
}

export function removeDeletedProductId(id: string | number) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const idStr = String(id);
    const current = getDeletedProductIds();
    current.delete(idStr);
    localStorage.setItem('mlx_deleted_product_ids', JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to remove deleted product id:', err);
  }
}
