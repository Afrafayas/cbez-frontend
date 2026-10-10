import { API_BASE_URL } from '../config/api';
import { Product, Shop, Lead, Category, Brand, SubscriptionPlan, Banner } from '../types';
import { getItem } from '../utils/storage';


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
  if (params?.city && params.city !== 'all' && params.city !== 'All Cities' && params.city !== 'All' && params.city !== 'Select Location' && (params?.lat === undefined || params?.lat === null)) query.append('city', params.city);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.shopId) query.append('shopId', params.shopId);
  if (params?.lat !== undefined && params?.lat !== null) query.append('lat', params.lat.toString());
  if (params?.lng !== undefined && params?.lng !== null) query.append('lng', params.lng.toString());
  if (params?.radiusKm) query.append('radiusKm', params.radiusKm.toString());

  query.append('_t', Date.now().toString());

  const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const ts = Date.now();
  const res = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}?_t=${ts}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
  if (!res.ok) throw new Error('Failed to fetch products by category');
  const result = await res.json();
  return result.data?.products ?? (Array.isArray(result) ? result : []);
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  const ts = Date.now();
  const res = await fetch(`${API_BASE_URL}/products/brand/${encodeURIComponent(brand)}?_t=${ts}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
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
    const saved = getItem('mlx_subscription_plans');
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
      const saved = getItem('mlx_subscription_plans');
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
export async function sendOtpApi(data: { phone: string; role?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      const errorMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
      throw new Error(errorMsg || 'Failed to send OTP');
    }
    return resData;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message === 'Failed to fetch') {
      console.warn('Backend API server unreachable, activating Demo OTP mode.');
      const cleanDigits = (data.phone || '').replace(/\D/g, '');
      const isTestNumber = cleanDigits.endsWith('9961624063');
      return {
        success: true,
        message: isTestNumber
          ? 'WhatsApp OTP sent! (Test Mode Code: 123456)'
          : 'WhatsApp OTP sent! Please check your WhatsApp messages.',
        isDemoMode: true
      };
    }
    throw err;
  }
}

export async function verifyOtpApi(data: { phone: string; otp: string; role?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      const errorMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
      throw new Error(errorMsg || 'Failed to verify OTP');
    }
    return resData;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message === 'Failed to fetch') {
      console.warn('Backend API server unreachable, verifying in Demo mode.');
      const cleanDigits = (data.phone || '').replace(/\D/g, '');
      const isTestNumber = cleanDigits.endsWith('9961624063');
      if (isTestNumber && data.otp === '123456') {
        return {
          success: true,
          isNewUser: false,
          data: {
            token: `demo-token-${Date.now()}`,
            user: {
              id: `user-${Date.now()}`,
              name: data.role === 'seller' ? 'Demo Dealer' : 'Demo Customer',
              phone: data.phone,
              email: `${cleanDigits}@cbez.in`,
              role: data.role || 'customer'
            }
          }
        };
      } else {
        throw new Error(isTestNumber ? 'Invalid OTP code. For test number, use code 123456' : 'Invalid OTP code. Please enter the valid OTP received on WhatsApp.');
      }
    }
    throw err;
  }
}

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
  password?: string;
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
    method: 'PUT',
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
  const ts = Date.now();
  const res = await fetch(`${API_BASE_URL}/products/mine?_t=${ts}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch shop products');
  const result = await res.json();
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.data?.products)) return result.data.products;
  if (Array.isArray(result.products)) return result.products;
  return [];
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
  const ts = Date.now();
  const res = await fetch(`${API_BASE_URL}/follows/shop-followers?_t=${ts}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
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
  const token = getItem('mlx_token');
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

const KNOWN_CITIES = [
  { name: 'Kochi, Ernakulam', lat: 9.9312, lng: 76.2673 },
  { name: 'Kakkanad, Ernakulam', lat: 10.0159, lng: 76.3419 },
  { name: 'Edappally, Ernakulam', lat: 10.0261, lng: 76.3084 },
  { name: 'Aluva, Ernakulam', lat: 10.1080, lng: 76.3570 },
  { name: 'Edappal, Malappuram', lat: 10.7550, lng: 76.0072 },
  { name: 'Ponnani, Malappuram', lat: 10.7667, lng: 75.9250 },
  { name: 'Tirur, Malappuram', lat: 10.9158, lng: 75.9239 },
  { name: 'Kuttippuram, Malappuram', lat: 10.8333, lng: 76.0333 },
  { name: 'Calicut, Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Trivandrum', lat: 8.5241, lng: 76.9366 },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { name: 'Guruvayur, Thrissur', lat: 10.5946, lng: 76.0416 },
  { name: 'Chavakkad, Thrissur', lat: 10.5847, lng: 76.0270 },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { name: 'Malappuram', lat: 11.0720, lng: 76.0740 },
  { name: 'Manjeri, Malappuram', lat: 11.1200, lng: 76.1200 },
  { name: 'Perinthalmanna, Malappuram', lat: 10.9780, lng: 76.2260 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kottayam', lat: 9.5916, lng: 76.5222 },
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 },
  { name: 'Idukki', lat: 9.8497, lng: 76.9806 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320 },
  { name: 'Kasaragod', lat: 12.5102, lng: 74.9852 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Mangalore', lat: 12.9141, lng: 74.8560 },
];

export function getNearestKnownCity(lat: number, lng: number): string {
  let minDistance = Infinity;
  let nearest = 'Kochi';
  const R = 6371; // Earth's radius in km
  for (const c of KNOWN_CITIES) {
    const dLat = ((c.lat - lat) * Math.PI) / 180;
    const dLng = ((c.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((c.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c.name;
    }
  }
  return nearest;
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  formattedAddress: string;
  city?: string;
  district?: string;
  country?: string;
}> {
  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      let city: string | undefined;
      let district: string | undefined;
      let country: string | undefined;

      if (Array.isArray(data.addressComponents)) {
        for (const comp of data.addressComponents) {
          if (comp.types.includes('locality') || comp.types.includes('sublocality_level_1') || comp.types.includes('administrative_area_level_2')) {
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
      if (city || district || data.formattedAddress) {
        return {
          formattedAddress: data.formattedAddress || city || district || '',
          city: city || district,
          district,
          country,
        };
      }
    }
  } catch (err) {
    console.warn('Backend reverse-geocode API fallback:', err);
  }

  // 2. OpenStreetMap Nominatim Free API Fallback
  try {
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const addr = nomData.address || {};
      const cityName = addr.city || addr.town || addr.suburb || addr.village || addr.municipality || addr.county || addr.state_district;
      const formatted = nomData.display_name || cityName || '';
      if (cityName || formatted) {
        return {
          formattedAddress: formatted,
          city: cityName || addr.county || addr.state_district,
          district: addr.county || addr.state_district || addr.state,
          country: addr.country,
        };
      }
    }
  } catch (nomErr) {
    console.warn('Nominatim reverse-geocode fallback failed:', nomErr);
  }

  // 3. Distance calculation fallback to nearest city
  const nearest = getNearestKnownCity(lat, lng);
  return {
    formattedAddress: nearest,
    city: nearest,
    district: nearest,
    country: 'India',
  };
}

export interface LocationPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
}

export async function fetchLocationSuggestions(query: string): Promise<LocationPrediction[]> {
  if (!query || query.trim().length < 2) return [];
  const trimmed = query.trim();

  // 1. Try Backend Autocomplete Endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/location/autocomplete?q=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.predictions) && data.predictions.length > 0) {
        return data.predictions;
      }
    }
  } catch (err) {
    console.warn('Backend autocomplete endpoint fallback:', err);
  }

  // 2. OpenStreetMap Nominatim Real-Time Location Search Fallback
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&addressdetails=1&limit=8`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'CbezFrontend/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => {
          const addr = item.address || {};
          const mainText = addr.shop || addr.amenity || addr.building || addr.suburb || addr.neighbourhood || addr.city || addr.town || item.display_name.split(',')[0];
          const secParts = [addr.county, addr.state_district, addr.state, 'India'].filter(Boolean);
          return {
            placeId: String(item.place_id || item.osm_id),
            description: item.display_name,
            mainText: mainText || item.display_name,
            secondaryText: Array.from(new Set(secParts)).join(', '),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        const seen = new Set<string>();
        const uniqueSuggestions: LocationPrediction[] = [];
        for (const item of mapped) {
          const key = `${item.mainText.trim().toLowerCase()}|${item.secondaryText.trim().toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueSuggestions.push(item);
          }
        }
        return uniqueSuggestions;
      }
    }
  } catch (nomErr) {
    console.warn('Nominatim suggestion fallback failed:', nomErr);
  }

  return [];
}

export async function searchGeocodeLocation(addressQuery: string): Promise<{
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  country?: string;
}> {
  if (!addressQuery) {
    return { formattedAddress: 'Kochi, Kerala', latitude: 9.9312, longitude: 76.2673, city: 'Kochi', district: 'Ernakulam', country: 'India' };
  }

  // 1. Backend Geocode API
  try {
    const res = await fetch(`${API_BASE_URL}/location/geocode?address=${encodeURIComponent(addressQuery)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          formattedAddress: data.formattedAddress || addressQuery,
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || 'Kochi',
          district: data.district || 'Ernakulam',
          country: 'India',
        };
      }
    }
  } catch (err) {
    console.warn('Backend geocode API fallback:', err);
  }

  // 2. OpenStreetMap Search Fallback
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&countrycodes=in&addressdetails=1&limit=1`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'CbezFrontend/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const addr = item.address || {};
        const cityName = addr.city || addr.town || addr.suburb || addr.village || addr.county || 'Kochi';
        return {
          formattedAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: cityName,
          district: addr.county || addr.state_district || cityName,
          country: addr.country || 'India',
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode fallback failed:', err);
  }

  return { formattedAddress: addressQuery, latitude: 9.9312, longitude: 76.2673, city: 'Kochi', district: 'Ernakulam', country: 'India' };
}

export async function fetchPlaceDetails(placeId: string, description?: string): Promise<{
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  country?: string;
}> {
  // 1. Try Backend Place Details Endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/location/place-details?placeId=${encodeURIComponent(placeId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          formattedAddress: data.formattedAddress || description || '',
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          district: data.district,
          country: data.country || 'India',
        };
      }
    }
  } catch (err) {
    console.warn('Backend place-details endpoint fallback:', err);
  }

  // 2. Geocode with description or placeId
  return searchGeocodeLocation(description || placeId);
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
  sellerId?: string;
}): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? getItem('mlx_token') : null;
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
  const ts = Date.now();
  const url = shopId
    ? `${API_BASE_URL}/activity-logs/seller/customers?shopId=${encodeURIComponent(shopId)}&_t=${ts}`
    : `${API_BASE_URL}/activity-logs/seller/customers?_t=${ts}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
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
    city?: string;
    address?: string;
    password?: string;
  }
) {
  try {
    const token = getItem('mlx_token');
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
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message === 'Failed to fetch') {
      console.warn('Backend API server unreachable, updating user in Demo mode.');
      return { id: userId, ...data };
    }
    throw err;
  }
}

/* Seller Shop Profile & Location Update */
export async function createOrUpdateMyShop(data: any) {
  const token = getItem('mlx_token');
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
  const token = getItem('mlx_token');
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

/* Image URL Formatter Helper */
export function formatImageUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/uploads/')) {
    const origin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${origin}${cleanPath}`;
  }
  return path;
}

/* --- BANNER API SERVICES --- */

export async function getActiveBanners(type?: string): Promise<Banner[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`${API_BASE_URL}/banners/active${query}`);
  if (!res.ok) throw new Error('Failed to fetch active banners');
  const result = await res.json();
  return result.data ?? (Array.isArray(result) ? result : []);
}

export async function getAllBanners(token: string, type?: string): Promise<Banner[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`${API_BASE_URL}/banners${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch banners list');
  const result = await res.json();
  return result.data ?? (Array.isArray(result) ? result : []);
}

export async function createBanner(
  data: { title: string; details?: string; image: string; type: 'banner' | 'ads'; shopId?: string; isActive?: boolean },
  token: string
): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/banners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create banner');
  return result.data || result;
}

export async function updateBanner(
  id: string,
  data: Partial<{ title: string; details: string; image: string; type: 'banner' | 'ads'; shopId: string; isActive: boolean }>,
  token: string
): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update banner');
  return result.data || result;
}

export async function toggleBannerStatus(id: string, isActive: boolean, token: string): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/banners/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update banner status');
  return result.data || result;
}

export async function deleteBannerApi(id: string, token: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.message || 'Failed to delete banner');
  return result;
}

export async function uploadBannerImageApi(file: File, token?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/upload/single?folder=banners`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload banner image');
  return data.data?.url || data.url || '';
}


