import { Shop, Product, User, Lead } from '../types';

export const INITIAL_SHOPS: Shop[] = [
  {
    id: "shop-1",
    name: "Kochi Gadgets World",
    ownerName: "Rajesh Kumar",
    phone: "+91 98765 43210",        
    whatsapp: "919876543210",
    address: "Shop 42, Ground Floor, Penta Menaka, Shanmugham Road",
    city: "Kochi",
    category: "Mobiles & Tablets",
    verified: true,
    rating: 4.9,
    joinedDate: "Feb 2024"
  },
  {
    id: "shop-2",
    name: "Calicut Refurb Store",
    ownerName: "Vikram Mehta",
    phone: "+91 98123 45678",
    whatsapp: "919812345678",
    address: "102, Focus Mall, Kozhikode",
    city: "Calicut",
    category: "Laptops & Accessories",
    verified: true,
    rating: 4.7,
    joinedDate: "Nov 2023"
  },
  {
    id: "shop-3",
    name: "Trivandrum Trust Mobiles",
    ownerName: "S. Srinivasan",
    phone: "+91 99400 12345",
    whatsapp: "919940012345",
    address: "Shop 15, Mall of Travancore",
    city: "Trivandrum",
    category: "All Tech Products",
    verified: true,
    rating: 4.8,
    joinedDate: "May 2024"
  },
  {
    id: "shop-4",
    name: "Thrissur Wearables Hub",
    ownerName: "Amit Shah",
    phone: "+91 90001 90002",
    whatsapp: "919000190002",
    address: "S-5, 2nd Floor, Round West",
    city: "Thrissur",
    category: "Smart Watches & Audio",
    verified: false,
    rating: 4.2,
    joinedDate: "Jan 2025"
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    name: "Arjun Nair",
    email: "arjun@gmail.com",
    phone: "+91 94460 55432"
  },
  {
    id: "user-2",
    name: "Priya Sharma",
    email: "priya@yahoo.com",
    phone: "+91 98950 12345"
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    shopId: "shop-1",
    productId: "prod-1",
    productName: "iPhone 13 (Grade A)",
    customerName: "Arjun Nair",
    customerPhone: "+91 94460 55432",
    contactType: "whatsapp",
    createdAt: "2026-08-04T10:15:30.000Z"
  },
  {
    id: "lead-2",
    shopId: "shop-1",
    productId: "prod-3",
    productName: "JioPhone Next (Grade B)",
    customerName: "Priya Sharma",
    customerPhone: "+91 98950 12345",
    contactType: "call",
    createdAt: "2026-08-04T11:45:10.000Z"
  },
  {
    id: "lead-3",
    shopId: "shop-2",
    productId: "prod-4",
    productName: "Samsung Galaxy S22",
    customerName: "Arjun Nair",
    customerPhone: "+91 94460 55432",
    contactType: "whatsapp",
    createdAt: "2026-08-04T14:20:00.000Z"
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "iPhone 13 (Grade A)",
    brand: "Apple",
    category: "Mobiles",
    description: "128GB, Blue color. 90% Battery health. Clean condition, no scratches on screen. Box and original charging cable are available.",
    price: 34000,
    stock: 2,
    shopId: "shop-1",
    specs: {
      "Storage": "128GB",
      "Color": "Blue",
      "Condition": "Grade A (Like New)",
      "Battery Health": "90%",
      "Box & Cable": "Available"
    },
    images: ["/images/iphone_17_pro_1.png"]
  },
  {
    id: "prod-2",
    name: "Redmi Note 12 (Excellent)",
    brand: "Xiaomi",
    category: "Mobiles",
    description: "6GB RAM, 128GB Storage. Matte Black. 1 year old, very lightly used. Comes with a fast charger and silicon cover.",
    price: 8500,
    stock: 3,
    shopId: "shop-1",
    specs: {
      "Storage": "128GB",
      "RAM": "6GB",
      "Condition": "Open Box (Like New)",
      "Warranty": "3 Months Seller Warranty"
    },
    images: ["/images/s24_ultra_1.png"]
  },
  {
    id: "prod-3",
    name: "JioPhone Next (Grade B)",
    brand: "Jio",
    category: "Mobiles",
    description: "Budget smartphone for daily use. 32GB Storage. Screen is fully functional with minor scratches on back cover. Ideal for calls and WhatsApp.",
    price: 2900,
    stock: 5,
    shopId: "shop-1",
    specs: {
      "Storage": "32GB",
      "Condition": "Grade B (Minor Wear)",
      "Color": "Black"
    },
    images: ["/images/iphone_17_pro_2.png"]
  },
  {
    id: "prod-4",
    name: "Samsung Galaxy S22",
    brand: "Samsung",
    category: "Mobiles",
    description: "Phantom White, 128GB storage. Mint condition. Screen replaced under official brand warranty. Battery health 88%.",
    price: 24500,
    stock: 1,
    shopId: "shop-2",
    specs: {
      "Storage": "128GB",
      "Color": "Phantom White",
      "Condition": "Grade A (Like New)",
      "Battery Health": "88%"
    },
    images: ["/images/s24_ultra_1.png"]
  },
  {
    id: "prod-5",
    name: "MacBook Air M1 (2020)",
    brand: "Apple",
    category: "Laptops",
    description: "8GB RAM, 256GB SSD. Space Grey. Keyboard and trackpad are spotless. Cycle count: 180. Comes with Apple brick and sleeve.",
    price: 48000,
    stock: 1,
    shopId: "shop-2",
    specs: {
      "Processor": "Apple M1 Chip",
      "RAM": "8GB",
      "Storage": "256GB SSD",
      "Condition": "Grade A (Like New)"
    },
    images: ["/images/macbook_air_m3.png"]
  },
  {
    id: "prod-6",
    name: "OnePlus Nord CE 3 Lite",
    brand: "OnePlus",
    category: "Mobiles",
    description: "Pastel Lime color. 8GB RAM, 128GB storage. Sealed pack open-box demonstration piece. 9 months remaining brand warranty.",
    price: 13500,
    stock: 2,
    shopId: "shop-3",
    specs: {
      "Storage": "128GB",
      "RAM": "8GB",
      "Condition": "Open Box (Like New)",
      "Warranty": "9 Months Brand Warranty"
    },
    images: ["/images/iphone_17_pro_1.png"]
  },
  {
    id: "prod-7",
    name: "Realme C53 (Like New)",
    brand: "Realme",
    category: "Mobiles",
    description: "Champion Gold. 64GB storage, 4GB RAM. Excellent backup device. Spotless screen, 100% functional.",
    price: 4800,
    stock: 4,
    shopId: "shop-3",
    specs: {
      "Storage": "64GB",
      "Condition": "Grade A (Like New)",
      "Color": "Champion Gold"
    },
    images: ["/images/s24_ultra_1.png"]
  },
  {
    id: "prod-8",
    name: "Apple Watch SE (44mm)",
    brand: "Apple",
    category: "Smart Watches",
    description: "GPS only, Midnight Aluminium Case. Minor scuffs on digital crown. Battery health 85%. Original strap included.",
    price: 14500,
    stock: 1,
    shopId: "shop-4",
    specs: {
      "Size": "44mm",
      "Condition": "Grade B (Minor Wear)",
      "Battery Health": "85%"
    },
    images: ["/images/watch_ultra_2.png"]
  },
  {
    id: "prod-9",
    name: "Noise ColorFit Pulse",
    brand: "Noise",
    category: "Smart Watches",
    description: "Smartwatch with heart rate monitoring. Mint condition, box opened. Excellent cheap accessory.",
    price: 1200,
    stock: 10,
    shopId: "shop-4",
    specs: {
      "Condition": "Open Box (Like New)",
      "Color": "Jet Black"
    },
    images: ["/images/watch_ultra_2.png"]
  }
];

export const CATEGORIES = [
  "All Categories",
  "Mobiles",
  "Laptops",
  "Accessories",
  "Tablets",
  "Smart Watches"
];

export const CITIES = [
  "All Cities",
  "Kochi",
  "Calicut",
  "Trivandrum",
  "Thrissur"
];

export const BUDGET_PRESETS = [
  "Any Budget",
  "Under ₹5,000",
  "Under ₹10,000",
  "Under ₹25,000",
  "Under ₹50,000"
];
