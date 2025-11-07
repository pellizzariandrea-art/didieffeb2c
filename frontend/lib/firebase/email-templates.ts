// lib/firebase/email-templates.ts
// Email Template Firestore Service

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getDbInstance } from './config';
import {
  EmailTemplate,
  EmailTemplateCreate,
  EmailTemplateUpdate,
  TemplateCategory
} from '@/types/email-template';

const COLLECTION_NAME = 'email_templates';

/**
 * Get all email templates
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const db = getDbInstance();
    const templatesRef = collection(db, COLLECTION_NAME);
    const q = query(templatesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as EmailTemplate[];
  } catch (error) {
    console.error('Error loading email templates:', error);
    throw error;
  }
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  try {
    const db = getDbInstance();
    const templateRef = doc(db, COLLECTION_NAME, id);
    const templateDoc = await getDoc(templateRef);

    if (!templateDoc.exists()) {
      return null;
    }

    return {
      id: templateDoc.id,
      ...templateDoc.data(),
      createdAt: templateDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: templateDoc.data().updatedAt?.toDate() || new Date(),
    } as EmailTemplate;
  } catch (error) {
    console.error('Error loading email template:', error);
    throw error;
  }
}

/**
 * Get email templates by category
 */
export async function getEmailTemplatesByCategory(category: TemplateCategory): Promise<EmailTemplate[]> {
  try {
    const db = getDbInstance();
    const templatesRef = collection(db, COLLECTION_NAME);
    const q = query(
      templatesRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as EmailTemplate[];
  } catch (error) {
    console.error('Error loading email templates by category:', error);
    throw error;
  }
}

/**
 * Get email template by slug
 */
export async function getEmailTemplateBySlug(slug: string): Promise<EmailTemplate | null> {
  try {
    const db = getDbInstance();
    const templatesRef = collection(db, COLLECTION_NAME);
    const q = query(templatesRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const templateDoc = snapshot.docs[0];
    return {
      id: templateDoc.id,
      ...templateDoc.data(),
      createdAt: templateDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: templateDoc.data().updatedAt?.toDate() || new Date(),
    } as EmailTemplate;
  } catch (error) {
    console.error('Error loading email template by slug:', error);
    throw error;
  }
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  template: EmailTemplateCreate,
  userId: string
): Promise<string> {
  try {
    const db = getDbInstance();
    const templatesRef = collection(db, COLLECTION_NAME);

    // Check if slug already exists
    const existing = await getEmailTemplateBySlug(template.slug);
    if (existing) {
      throw new Error(`Un template con slug "${template.slug}" esiste già`);
    }

    // Create initial empty translations for all languages
    const emptyTranslations = {
      it: { subject: '', body: '' },
      en: { subject: '', body: '' },
      de: { subject: '', body: '' },
      fr: { subject: '', body: '' },
      es: { subject: '', body: '' },
      pt: { subject: '', body: '' },
    };

    const newTemplate = {
      ...template,
      translations: emptyTranslations,
      enabled: template.enabled ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      lastModifiedBy: userId,
    };

    const docRef = await addDoc(templatesRef, newTemplate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  id: string,
  updates: EmailTemplateUpdate,
  userId: string
): Promise<void> {
  try {
    const db = getDbInstance();
    const templateRef = doc(db, COLLECTION_NAME, id);

    await updateDoc(templateRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(id: string): Promise<void> {
  try {
    const db = getDbInstance();
    const templateRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(templateRef);
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
}

/**
 * Toggle template enabled status
 */
export async function toggleEmailTemplateStatus(
  id: string,
  userId: string
): Promise<void> {
  try {
    const template = await getEmailTemplate(id);
    if (!template) {
      throw new Error('Template non trovato');
    }

    await updateEmailTemplate(id, { enabled: !template.enabled }, userId);
  } catch (error) {
    console.error('Error toggling email template status:', error);
    throw error;
  }
}
