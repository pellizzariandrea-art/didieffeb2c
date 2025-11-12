// lib/firebase/email-templates-server.ts
// Email Template Firestore Service (Server-side using Admin SDK)

import { getAdminFirestore } from './admin';
import type {
  EmailTemplate,
  TemplateCategory
} from '@/types/email-template';

const COLLECTION_NAME = 'email_templates';

/**
 * Get all email templates (server-side)
 */
export async function getEmailTemplatesServer(): Promise<EmailTemplate[]> {
  try {
    const db = getAdminFirestore();
    const templatesRef = db.collection(COLLECTION_NAME);
    const snapshot = await templatesRef.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate;
    });
  } catch (error) {
    console.error('Error loading email templates (server):', error);
    throw error;
  }
}

/**
 * Get a single email template by ID (server-side)
 */
export async function getEmailTemplateServer(id: string): Promise<EmailTemplate | null> {
  try {
    const db = getAdminFirestore();
    const templateRef = db.collection(COLLECTION_NAME).doc(id);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return null;
    }

    const data = templateDoc.data()!;
    return {
      id: templateDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as EmailTemplate;
  } catch (error) {
    console.error('Error loading email template (server):', error);
    throw error;
  }
}

/**
 * Get email templates by category (server-side)
 */
export async function getEmailTemplatesByCategoryServer(category: TemplateCategory): Promise<EmailTemplate[]> {
  try {
    const db = getAdminFirestore();
    const templatesRef = db.collection(COLLECTION_NAME);
    const snapshot = await templatesRef
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate;
    });
  } catch (error) {
    console.error('Error loading email templates by category (server):', error);
    throw error;
  }
}

/**
 * Get email template by slug (server-side)
 */
export async function getEmailTemplateBySlugServer(slug: string): Promise<EmailTemplate | null> {
  try {
    const db = getAdminFirestore();
    const templatesRef = db.collection(COLLECTION_NAME);
    const snapshot = await templatesRef.where('slug', '==', slug).get();

    if (snapshot.empty) {
      return null;
    }

    const templateDoc = snapshot.docs[0];
    const data = templateDoc.data();
    return {
      id: templateDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as EmailTemplate;
  } catch (error) {
    console.error('Error loading email template by slug (server):', error);
    throw error;
  }
}
