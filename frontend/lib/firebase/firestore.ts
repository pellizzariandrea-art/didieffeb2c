// lib/firebase/firestore.ts
// Firestore Database Utilities

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDbInstance } from './config';
import type { UserProfile } from '@/types/auth';
import type { Order, CreateOrderData, UpdateOrderData } from '@/types/order';

// ==================== USERS ====================

// Create user profile
export async function createUserProfile(
  userId: string,
  profile: UserProfile
) {
  try {
    const db = getDbInstance();
    await setDoc(doc(db, 'users', userId), {
      ...profile,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(profile.updatedAt),
    });
  } catch (error: any) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const db = getDbInstance();
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Helper to convert timestamp or ISO string to Date
    const toDate = (value: any): Date | undefined => {
      if (!value) return undefined;
      if (typeof value === 'string') return new Date(value);
      if (value.toDate && typeof value.toDate === 'function') return value.toDate();
      return undefined;
    };

    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastLogin: toDate(data.lastLogin),
    } as UserProfile;
  } catch (error: any) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  try {
    const db = getDbInstance();
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

// Update last login
export async function updateLastLogin(userId: string) {
  try {
    const db = getDbInstance();
    await updateDoc(doc(db, 'users', userId), {
      lastLogin: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Failed to update last login:', error);
  }
}

// Get pending users (for admin approval)
export async function getPendingUsers(): Promise<UserProfile[]> {
  try {
    const db = getDbInstance();
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
      } as UserProfile;
    });
  } catch (error: any) {
    throw new Error(`Failed to get pending users: ${error.message}`);
  }
}

// Get active users (optionally filtered by role)
export async function getActiveUsers(role?: 'b2b' | 'b2c'): Promise<UserProfile[]> {
  try {
    const db = getDbInstance();
    let q;

    if (role) {
      // Filter by both status and role
      q = query(
        collection(db, 'users'),
        where('status', '==', 'active'),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Filter only by status
      q = query(
        collection(db, 'users'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
      } as UserProfile;
    });
  } catch (error: any) {
    throw new Error(`Failed to get active users: ${error.message}`);
  }
}

// ==================== ORDERS ====================

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `ORD-${year}${month}${day}-${random}`;
}

// Create order
export async function createOrder(
  userId: string,
  userEmail: string,
  userRole: 'b2c' | 'b2b',
  data: CreateOrderData
): Promise<string> {
  try {
    const db = getDbInstance();
    const orderNumber = generateOrderNumber();

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shipping = 0; // Calculate based on rules
    const tax = subtotal * 0.22; // 22% IVA
    const total = subtotal + shipping + tax;

    const order: Omit<Order, 'id'> = {
      orderNumber,
      userId,
      userEmail,
      userRole,
      items: data.items,
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Ordine ricevuto',
        },
      ],
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      customerNotes: data.customerNotes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: order.statusHistory.map((h) => ({
        ...h,
        timestamp: Timestamp.fromDate(h.timestamp),
      })),
    });

    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

// Get user orders
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const db = getDbInstance();
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        confirmedAt: data.confirmedAt?.toDate(),
        paidAt: data.paidAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        statusHistory: data.statusHistory?.map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate(),
        })),
      } as Order;
    });
  } catch (error: any) {
    throw new Error(`Failed to get user orders: ${error.message}`);
  }
}

// Get all orders (admin)
export async function getAllOrders(): Promise<Order[]> {
  try {
    const db = getDbInstance();
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        confirmedAt: data.confirmedAt?.toDate(),
        paidAt: data.paidAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        statusHistory: data.statusHistory?.map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate(),
        })),
      } as Order;
    });
  } catch (error: any) {
    throw new Error(`Failed to get all orders: ${error.message}`);
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const db = getDbInstance();
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      paidAt: data.paidAt?.toDate(),
      shippedAt: data.shippedAt?.toDate(),
      deliveredAt: data.deliveredAt?.toDate(),
      statusHistory: data.statusHistory?.map((h: any) => ({
        ...h,
        timestamp: h.timestamp?.toDate(),
      })),
    } as Order;
  } catch (error: any) {
    throw new Error(`Failed to get order: ${error.message}`);
  }
}

// Update order (admin)
export async function updateOrder(
  orderId: string,
  updates: UpdateOrderData
): Promise<void> {
  try {
    const db = getDbInstance();
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Update status history if status changed
    if (updates.status && updates.status !== order.status) {
      const newHistoryEntry = {
        status: updates.status,
        timestamp: Timestamp.now(),
        note: updates.statusNote,
      };

      updateData.statusHistory = [
        ...order.statusHistory.map((h) => ({
          ...h,
          timestamp: Timestamp.fromDate(h.timestamp),
        })),
        newHistoryEntry,
      ];

      // Set status-specific timestamps
      if (updates.status === 'confirmed') {
        updateData.confirmedAt = serverTimestamp();
      } else if (updates.status === 'paid') {
        updateData.paidAt = serverTimestamp();
      } else if (updates.status === 'shipped') {
        updateData.shippedAt = serverTimestamp();
      } else if (updates.status === 'delivered') {
        updateData.deliveredAt = serverTimestamp();
      }
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);
  } catch (error: any) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

// Get orders by status (admin)
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  try {
    const db = getDbInstance();
    const q = query(
      collection(db, 'orders'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        confirmedAt: data.confirmedAt?.toDate(),
        paidAt: data.paidAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        statusHistory: data.statusHistory?.map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate(),
        })),
      } as Order;
    });
  } catch (error: any) {
    throw new Error(`Failed to get orders by status: ${error.message}`);
  }
}
