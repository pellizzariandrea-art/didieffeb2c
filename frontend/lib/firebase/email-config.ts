// lib/firebase/email-config.ts
// Firestore operations for email configuration

import { dbInstance } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface EmailConfig {
  brevo: {
    senderEmail: string;
    senderName: string;
    replyToEmail: string;
    replyToName: string;
  };
  templates: {
    b2c_welcome: {
      subject: string;
      enabled: boolean;
    };
    b2b_confirmation: {
      subject: string;
      enabled: boolean;
    };
  };
  logo?: {
    base64: string;
    type: string;
    uploadedAt: string;
  };
}

// Default configuration
const DEFAULT_CONFIG: EmailConfig = {
  brevo: {
    senderEmail: 'noreply@didieffe.com',
    senderName: 'Didieffe B2B',
    replyToEmail: 'apellizzari@didieffe.com',
    replyToName: 'Didieffe Support',
  },
  templates: {
    b2c_welcome: {
      subject: 'Benvenuto su Didieffe B2B!',
      enabled: true,
    },
    b2b_confirmation: {
      subject: 'Richiesta Registrazione B2B Ricevuta - Didieffe',
      enabled: true,
    },
  },
};

/**
 * Get email configuration from Firestore
 * @returns Email configuration or default if not found
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    console.log('[Email Config] Loading from Firestore...');

    const docRef = doc(dbInstance!, 'settings', 'email');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const config = docSnap.data() as EmailConfig;
      console.log('[Email Config] Loaded successfully:', config);
      return config;
    } else {
      console.log('[Email Config] No config found, returning defaults');
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('[Email Config] Error loading config:', error);
    throw new Error('Failed to load email configuration');
  }
}

/**
 * Save email configuration to Firestore
 * @param config - Email configuration to save
 */
export async function saveEmailConfig(config: EmailConfig): Promise<void> {
  try {
    console.log('[Email Config] Saving to Firestore:', config);

    const docRef = doc(dbInstance!, 'settings', 'email');
    await setDoc(docRef, config, { merge: true });

    console.log('[Email Config] Saved successfully');
  } catch (error) {
    console.error('[Email Config] Error saving config:', error);
    throw new Error('Failed to save email configuration');
  }
}

/**
 * Upload logo and update configuration
 * @param base64 - Base64 encoded logo
 * @param type - MIME type of the image
 */
export async function uploadLogo(base64: string, type: string): Promise<void> {
  try {
    console.log('[Email Config] Uploading logo...');

    // Get current config
    const config = await getEmailConfig();

    // Update logo
    config.logo = {
      base64,
      type,
      uploadedAt: new Date().toISOString(),
    };

    // Save updated config
    await saveEmailConfig(config);

    console.log('[Email Config] Logo uploaded successfully');
  } catch (error) {
    console.error('[Email Config] Error uploading logo:', error);
    throw new Error('Failed to upload logo');
  }
}
