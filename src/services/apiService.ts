import { API_BASE_URL } from '../config/api';
import { Product, Shop, Lead, Category, Brand } from '../types';

export async function getProducts(params?: {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  city?: string;
  sortBy?: string;
  shopId?: string;
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

/* Auth APIs */
export async function loginUser(credentials: { email: string; password: string }) {
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
  productId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  contactType: 'call' | 'whatsapp';
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
  const res = await fetch(`${API_BASE_URL}/network/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

