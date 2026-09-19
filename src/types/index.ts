export interface UserProfile {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  image?: string;
  role: "customer" | "shopkeeper";
  address?: string;
  phoneNumber?: string;
  gender?: string;
  shopName?: string;
  latitude?: number;
  longitude?: number;
  roleLocked: boolean;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: BakiTransaction[];
}

export interface BakiTransaction {
  _id: string;
  productDetails: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface Shop {
  _id: string;
  ownerId: string;
  name: string;
  address?: string;
  isOpen: boolean;
  scheduleEnabled?: boolean;
  openingHours?: Record<string, { enabled: boolean; open: string; close: string }>;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
  paymentMethods?: Array<{ name: string; phone: string }>;
}

export interface Order {
  _id: string;
  customerId: string;
  shopId: string;
  shopName: string;
  items: string;
  quantity?: string;
  notes?: string;
  paymentMethod?: "cod" | "baki" | "online";
  paymentProvider?: "stripe" | "bkash" | "nagad" | "other";
  estimatedAmount?: number;
  billedAmount?: number;
  bakiCharged?: boolean;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "preparing"
    | "delivered"
    | "completed"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  _id: string;
  shopId: string;
  ownerId: string;
  itemName: string;
  price: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  note?: string;
  createdAt: string;
}

export interface BakiMember {
  _id: string;
  shopId: string;
  memberCode?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  balance: number;
  creditLimit?: number;
  status: "pending" | "approved" | "rejected";
  shopName?: string;
  transactions?: BakiTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  customerId: string;
  shopId?: string;
  bakiId?: string;
  amount: number;
  method: "stripe" | "bkash" | "nagad" | "other";
  status: "pending" | "paid" | "failed" | "cancelled" | "verified";
  type: "baki" | "subscription";
  tranId?: string;
  sessionId?: string;
  customer?: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  } | null;
  createdAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: string[];
}

export interface Subscription {
  _id: string;
  shopkeeperId: string;
  planId: string;
  amount: number;
  method: string;
  status: string;
  billingCycle?: "monthly" | "annual";
  expiresAt?: string;
  features?: string[];
  name?: string;
  remainingDays?: number | null;
  isExpired?: boolean;
  createdAt: string;
}
