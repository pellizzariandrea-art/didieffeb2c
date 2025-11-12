// Email logging utility
import { getAdminFirestore } from '@/lib/firebase/admin';

export interface EmailLogData {
  to: string;
  subject: string;
  templateSlug?: string;
  status: 'success' | 'error' | 'pending';
  messageId?: string;
  error?: string;
  brevoResponse?: any;
}

export async function logEmail(data: EmailLogData) {
  try {
    const db = getAdminFirestore();

    const logEntry = {
      ...data,
      createdAt: new Date(),
      sentAt: data.status === 'success' ? new Date() : null,
    };

    await db.collection('email_logs').add(logEntry);
    console.log(`📝 Email log saved: ${data.to} - ${data.status}`);
  } catch (error) {
    console.error('❌ Error saving email log:', error);
    // Don't throw - logging should not break email sending
  }
}
