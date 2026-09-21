import { API_BASE_URL } from '../config/api';
import { Product, Shop, Lead, Category, Brand, SubscriptionPlan } from '../types';

export async function getProducts(params?: {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  city?: string;
  sortBy?: string;
  shopId?: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params?.minPrice) query.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) query.append('maxPrice', params.maxPrice.toString());
  if (params?.city) query.append('city', params.city);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.shopId) query.append('shopId', params.shopId);
  if (params?.lat !== undefined && params?.lat !== null) query.append('lat', params.lat.toString());
  if (params?.lng !== undefined && params?.lng !== null) query.append('lng', params.lng.toString());
  if (params?.radiusKm) query.append('radiusKm', params.radiusKm.toString());

  const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error('Failed to fetch products by category');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products/brand/${encodeURIComponent(brand)}`);
  if (!res.ok) throw new Error('Failed to fetch products by brand');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function getShops(): Promise<Shop[]> {
  const res = await fetch(`${API_BASE_URL}/shops`);
  if (!res.ok) throw new Error('Failed to fetch shops');
  const result = await res.json();
  return result.data?.shops ?? (Array.isArray(result) ? result : []);
}

export async function getShopById(id: string): Promise<Shop | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/${id}`);
    if (!res.ok) return null;
    const result = await res.json();
    return result.data?.shop || null;
  } catch {
    return null;
  }
}

/* Category CRUD APIs */
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const result = await res.json();
  return result.data?.categories ?? (Array.isArray(result) ? result : []);
}

export async function createCategory(data: { name: string; slug?: string; image?: string }, token: string): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create category');
  return result;
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; image?: string }, token: string): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update category');
  return result;
}

export async function deleteCategory(id: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to delete category');
  return result;
}

/* Brand CRUD APIs */
export async function getBrands(): Promise<Brand[]> {
  const res = await fetch(`${API_BASE_URL}/brands`);
  if (!res.ok) throw new Error('Failed to fetch brands');
  const result = await res.json();
  return result.data?.brands ?? (Array.isArray(result) ? result : []);
}

export async function createBrand(data: { name: string; logo?: string }, token: string): Promise<Brand> {
  const res = await fetch(`${API_BASE_URL}/brands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create brand');
  return result;
}

export async function updateBrand(id: string, data: { name?: string; logo?: string }, token: string): Promise<Brand> {
  const res = await fetch(`${API_BASE_URL}/brands/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update brand');
  return result;
}

export async function deleteBrand(id: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/brands/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to delete brand');
  return result;
}

/* Subscription Plan APIs */

export async function getShopSubscription(shopId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/shop/${shopId}`);
    if (!res.ok) return null;
    const result = await res.json();
    return result.data ?? null;
  } catch (err) {
    console.error('Failed to fetch shop subscription:', err);
    return null;
  }
}

export async function getMyShopSubscription(token: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/mine`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.data ?? null;
  } catch (err) {
    console.error('Failed to fetch my subscription:', err);
    return null;
  }
}

export async function getShop(shopId: string): Promise<Shop | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    if (!res.ok) return null;
    const result = await res.json();
    return result.data?.shop ?? null;
  } catch (err) {
    console.error('Failed to fetch shop:', err);
    return null;
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/plans`);
    if (!res.ok) throw new Error('Failed to fetch subscription plans');
    const result = await res.json();
    return result.data?.plans ?? (Array.isArray(result) ? result : []);
  } catch {
    const saved = localStorage.getItem('mlx_subscription_plans');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/plans/active`);
    if (!res.ok) throw new Error('Failed to fetch active subscription plans');
    const result = await res.json();
    return result.data?.plans ?? (Array.isArray(result) ? result : []);
  } catch {
    try {
      const plans = await getSubscriptionPlans();
      return plans.filter(p => p.status === 'ACTIVE');
    } catch {
      const saved = localStorage.getItem('mlx_subscription_plans');
      if (saved) {
        const plans: SubscriptionPlan[] = JSON.parse(saved);
        return plans.filter(p => p.status === 'ACTIVE');
      }
      return [];
    }
  }
}

export async function createSubscriptionPlan(planData: Omit<SubscriptionPlan, 'id'>, token?: string): Promise<SubscriptionPlan> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(planData),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create subscription plan');
  return result;
}

export async function updateSubscriptionPlan(id: string, planData: Partial<SubscriptionPlan>, token?: string): Promise<SubscriptionPlan> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/plans/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(planData),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update subscription plan');
  return result;
}

export async function toggleSubscriptionPlanStatus(id: string, status?: string, token?: string): Promise<SubscriptionPlan> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/plans/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to toggle subscription plan status');
  return result;
}

export async function deleteSubscriptionPlan(id: string, token?: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/plans/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to delete subscription plan');
  return result;
}

/* Auth APIs */
export async function loginUser(credentials: { email?: string; phone?: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function registerUser(userData: {
  email?: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  shopName?: string;
  ownerName?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  category?: string;
  subscriptionPlanId?: string;
  district?: string;
  country?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  profileImage?: string;
  gstNumber?: string;
  websiteUrl?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: string;
  businessDescription?: string;
  alternatePhone?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(errorMsg || 'Registration failed');
  }
  return data;
}

export async function sendLead(leadData: {
  shopId: string;
  productId?: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  contactType: 'call' | 'whatsapp';
  userId?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit inquiry');
  return data;
}

export async function getSellerLeads(token: string): Promise<Lead[]> {
  const res = await fetch(`${API_BASE_URL}/leads/seller`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch seller leads');
  const result = await res.json();
  return result.data?.leads ?? (Array.isArray(result) ? result : []);
}

export async function getSellerProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch shop products');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function createSellerProduct(
  productData: {
    name: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    stock?: number;
    specs?: Record<string, string>;
    images?: string[];
  },
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(errorMsg || 'Failed to create product listing');
  }
  return data;
}

export async function updateSellerProduct(
  productId: string,
  productData: {
    name?: string;
    brand?: string;
    category?: string;
    description?: string;
    price?: number;
    stock?: number;
    specs?: Record<string, string>;
    images?: string[];
  },
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(errorMsg || 'Failed to update product listing');
  }
  return data;
}

export async function deleteSellerProduct(productId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete product listing');
  return data;
}

/* Follow Shop APIs */
export async function followShop(shopId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/follows/${shopId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to follow shop');
  return data;
}

export async function unfollowShop(shopId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/follows/${shopId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to unfollow shop');
  return data;
}

export async function getFollowedShops(token: string): Promise<Shop[]> {
  const res = await fetch(`${API_BASE_URL}/follows/my-shops`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch followed shops');
  const result = await res.json();
  return result.data?.shops ?? [];
}

export async function checkFollowStatus(shopId: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/follows/status/${shopId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const result = await res.json();
  return Boolean(result.isFollowing);
}

export async function getShopFollowers(token: string): Promise<{ count: number; followers: Array<{ id: string; name: string; email?: string; phone?: string; followedAt: string }> }> {
  const res = await fetch(`${API_BASE_URL}/follows/shop-followers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch shop followers');
  const result = await res.json();
  return result.data ?? { count: 0, followers: [] };
}

/* Local Shop Network Sourcing Request APIs */
export async function createNetworkInquiry(inquiryData: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  category: string;
  gadgetNeeded: string;
  targetBudget?: number;
  notes?: string;
}) {
  const token = localStorage.getItem('mlx_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/network/inquiries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(inquiryData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit network request');
  return data;
}

export async function getNetworkInquiries(params?: {
  city?: string;
  category?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.city) query.append('city', params.city);
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE_URL}/network/inquiries?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch network inquiries');
  const result = await res.json();
  return result.data?.inquiries ?? [];
}

/* Location & Geocoding APIs */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
  const res = await fetch(`${API_BASE_URL}/location/geocode?address=${encodeURIComponent(address)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Geocoding failed');
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    formattedAddress: data.formattedAddress || address,
  };
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  formattedAddress: string;
  city?: string;
  district?: string;
  country?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Reverse geocoding failed');

  let city: string | undefined;
  let district: string | undefined;
  let country: string | undefined;

  if (Array.isArray(data.addressComponents)) {
    for (const comp of data.addressComponents) {
      if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) {
        city = city || comp.long_name;
      }
      if (comp.types.includes('administrative_area_level_2') || comp.types.includes('administrative_area_level_1')) {
        district = district || comp.long_name;
      }
      if (comp.types.includes('country')) {
        country = comp.long_name;
      }
    }
  }

  return {
    formattedAddress: data.formattedAddress || '',
    city,
    district,
    country,
  };
}

/* Wishlist APIs */
export async function toggleWishlist(productId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/wishlist/toggle/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update wishlist');
  return data;
}

export async function addToWishlist(productId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add to wishlist');
  return data;
}

export async function removeFromWishlist(productId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove from wishlist');
  return data;
}

export async function getUserWishlist(token: string) {
  const res = await fetch(`${API_BASE_URL}/wishlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch wishlist');
  return data.data ?? { count: 0, items: [], products: [] };
}

export async function getWishlistIds(token: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/wishlist/ids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return [];
  return data.data?.productIds ?? [];
}



/* Activity Logging API */
export async function logActivity(data: {
  action: string;
  details?: string;
  userId?: string;
}): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mlx_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetch(`${API_BASE_URL}/activity-logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

/* Seller Customer Activity Logs API */
export async function getSellerCustomerActivityLogs(token: string, shopId?: string): Promise<any> {
  const url = shopId
    ? `${API_BASE_URL}/activity-logs/seller/customers?shopId=${encodeURIComponent(shopId)}`
    : `${API_BASE_URL}/activity-logs/seller/customers`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to fetch customer activity logs');
  }
  return result.data;
}

/* Update User Profile & Location */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    latitude?: number | null;
    longitude?: number | null;
    role?: string;
  }
) {
  const token = localStorage.getItem('mlx_token');
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update user profile');
  }
  const json = await res.json();
  return json.data?.user || json.user || json;
}

/* Seller Shop Profile & Location Update */
export async function createOrUpdateMyShop(data: any) {
  const token = localStorage.getItem('mlx_token');
  const res = await fetch(`${API_BASE_URL}/shops/mine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save shop profile');
  }
  const json = await res.json();
  return json.data?.shop || json.shop || json;
}

export async function updateShop(shopId: string, data: any) {
  const token = localStorage.getItem('mlx_token');
  const res = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update shop');
  }
  const json = await res.json();
  return json.data?.shop || json.shop || json;
}

export async function deleteProductApi(productId: string, token: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.message || 'Failed to delete product listing');
  }
  return result;
}

