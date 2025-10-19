# 🚀 BRIEF SVILUPPO E-COMMERCE AI - PER CLAUDE CODE

## 📋 OVERVIEW PROGETTO

Sviluppa un sistema e-commerce completo composto da **DUE applicazioni separate**:

1. **ADMIN DASHBOARD** - Pannello per mappare database MySQL → JSON
2. **E-COMMERCE WEB** - Shop online con AI integrata

---

## 🎯 OBIETTIVI

- Collegare database MySQL esistente su Siteground
- Mappare dinamicamente colonne DB → struttura JSON con attributi flessibili
- Generare automaticamente descrizioni prodotto con AI (Claude)
- Shop online moderno con ricerca conversazionale AI
- Sistema cache per ridurre costi AI del 70%
- Design glassmorphism premium, dark mode
- Mobile-first responsive
- Carrello Snipcart integrato

---

## 🏗️ ARCHITETTURA SISTEMA

```
DATABASE MYSQL (Siteground)
         ↓
ADMIN DASHBOARD (Next.js)
    - Connessione DB
    - Mapping campi → JSON
    - Export products.json
         ↓
products.json (generato)
         ↓
E-COMMERCE WEB (Next.js)
    - Legge products.json
    - AI genera contenuti
    - Snipcart checkout
    - Brevo emails
```

---

## 📦 PROGETTO 1: ADMIN DASHBOARD

### Obiettivo
Applicazione web per:
- Connettere database MySQL su Siteground
- Mappare visualmente colonne DB → campi JSON
- Configurare attributi dinamici
- Generare products.json per e-commerce

### Stack Tecnologico
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn/ui
- mysql2 (connector MySQL)
- File system per configurazioni

### Inizializzazione

```bash
# Crea progetto
npx create-next-app@latest admin-dashboard --typescript --tailwind --app --use-npm

cd admin-dashboard

# Dipendenze
npm install mysql2
npm install zod
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge

# Shadcn/ui
npx shadcn-ui@latest init -d
npx shadcn-ui@latest add button card input select badge separator toast tabs alert
```

### Struttura File

```
admin-dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard home
│   ├── setup/
│   │   ├── connection/page.tsx     # Step 1: DB Connection
│   │   ├── mapping/page.tsx        # Step 2: Field Mapping
│   │   ├── preview/page.tsx        # Step 3: Preview & Test
│   │   └── export/page.tsx         # Step 4: Export & Sync
│   ├── api/
│   │   ├── db/
│   │   │   ├── connect/route.ts    # Test DB connection
│   │   │   ├── tables/route.ts     # List tables
│   │   │   ├── columns/route.ts    # Get table columns
│   │   │   └── preview/route.ts    # Preview data
│   │   ├── mapping/
│   │   │   ├── save/route.ts       # Save mapping config
│   │   │   └── load/route.ts       # Load mapping config
│   │   └── export/
│   │       ├── json/route.ts       # Generate products.json
│   │       └── sync/route.ts       # Auto-sync endpoint
│   └── globals.css
│
├── components/
│   ├── setup/
│   │   ├── ConnectionForm.tsx      # Form connessione DB
│   │   ├── MappingInterface.tsx    # UI drag-drop mapping
│   │   ├── AttributeMapper.tsx     # Gestione attributi dinamici
│   │   ├── PreviewPanel.tsx        # Anteprima JSON
│   │   └── ExportControls.tsx      # Pulsanti export/sync
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/                         # Shadcn components
│
├── lib/
│   ├── db/
│   │   ├── mysql-connector.ts      # MySQL connection handler
│   │   ├── schema.ts               # Get DB schema info
│   │   └── query.ts                # Execute queries
│   ├── mapping/
│   │   ├── transform.ts            # Data transformations
│   │   ├── validate.ts             # Validation rules
│   │   └── config-manager.ts       # Save/load config
│   └── export/
│       └── json-generator.ts       # Generate products.json
│
├── config/
│   ├── db-connection.json          # Saved DB config
│   └── field-mapping.json          # Saved mapping
│
├── types/
│   └── index.ts
│
└── .env.local
```

### Environment Variables (.env.local)

```bash
# Admin Security
ADMIN_SECRET=your_secure_password_here

# Path to e-commerce data folder
ECOMMERCE_DATA_PATH=../ecommerce-ai/data

# Database (for reference, actual values in UI)
# DB_HOST=mysql.tuodominio.it
# DB_PORT=3306
# DB_NAME=db_prodotti
# DB_USER=user_db
# DB_PASSWORD=password_db
# DB_TABLE=products
```

### Types (types/index.ts)

```typescript
export interface DBConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  table: string;
}

export interface FieldMapping {
  dbColumn: string;
  targetField: string;
  isAttribute: boolean;
  attributeName?: string;
  transform?: 'parseFloat' | 'parseInt' | 'toUpperCase' | 'toLowerCase' | 'trim';
}

export interface MappingConfig {
  connection: DBConnection;
  mappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}
```

### Funzionalità Chiave

#### 1. Connessione Database (lib/db/mysql-connector.ts)

```typescript
import mysql from 'mysql2/promise';
import { DBConnection } from '@/types';

export async function testConnection(config: DBConnection) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database
  });

  // Test query
  await connection.query('SELECT 1');
  
  // Get tables
  const [tables] = await connection.query('SHOW TABLES');
  
  await connection.end();
  
  return {
    success: true,
    tables: (tables as any[]).map(t => Object.values(t)[0])
  };
}

export async function getTableColumns(config: DBConnection) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database
  });

  const [columns] = await connection.query(`SHOW COLUMNS FROM ${config.table}`);
  
  await connection.end();
  
  return (columns as any[]).map(col => ({
    name: col.Field,
    type: col.Type,
    nullable: col.Null === 'YES'
  }));
}

export async function fetchProducts(config: DBConnection, limit?: number) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database
  });

  const query = limit 
    ? `SELECT * FROM ${config.table} LIMIT ${limit}`
    : `SELECT * FROM ${config.table}`;
    
  const [rows] = await connection.query(query);
  
  await connection.end();
  
  return rows;
}
```

#### 2. Data Transformation (lib/mapping/transform.ts)

```typescript
import { FieldMapping } from '@/types';

export async function applyTransform(value: any, transform?: string): Promise<any> {
  if (!transform || value === null || value === undefined) return value;
  
  switch (transform) {
    case 'parseFloat':
      return parseFloat(value);
    case 'parseInt':
      return parseInt(value);
    case 'toUpperCase':
      return String(value).toUpperCase();
    case 'toLowerCase':
      return String(value).toLowerCase();
    case 'trim':
      return String(value).trim();
    default:
      return value;
  }
}

export async function transformRow(row: any, mappings: FieldMapping[]) {
  const product: any = {
    attributi: {}
  };

  for (const mapping of mappings) {
    const value = row[mapping.dbColumn];
    const transformed = await applyTransform(value, mapping.transform);

    if (mapping.isAttribute && mapping.attributeName) {
      product.attributi[mapping.attributeName] = transformed;
    } else {
      product[mapping.targetField] = transformed;
    }
  }

  return product;
}
```

#### 3. JSON Generator (lib/export/json-generator.ts)

```typescript
import fs from 'fs/promises';
import path from 'path';
import { fetchProducts } from '@/lib/db/mysql-connector';
import { transformRow } from '@/lib/mapping/transform';
import { MappingConfig } from '@/types';

export async function generateProductsJSON(config: MappingConfig) {
  // Fetch all products from DB
  const rows = await fetchProducts(config.connection);
  
  // Transform each row
  const products = await Promise.all(
    rows.map(row => transformRow(row, config.mappings))
  );

  // Create output structure
  const output = {
    prodotti: products,
    generated_at: new Date().toISOString(),
    total: products.length,
    source: {
      database: config.connection.database,
      table: config.connection.table
    }
  };

  // Save to e-commerce data folder
  const outputPath = path.join(
    process.cwd(),
    process.env.ECOMMERCE_DATA_PATH || '../ecommerce-ai/data',
    'products.json'
  );

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  return {
    success: true,
    path: outputPath,
    count: products.length
  };
}
```

### UI Flow

**Step 1: Connection**
- Form per inserire credenziali DB
- Test connection button
- Se OK, mostra lista tabelle
- Seleziona tabella prodotti
- Salva config → vai a Step 2

**Step 2: Mapping**
- Mostra colonne DB disponibili
- Interfaccia drag-drop/select per mappare:
  - Campi obbligatori: codice, descrizione, prezzo, immagine
  - Attributi dinamici: qualsiasi altro campo → attributi.{nome}
- Per ogni campo: dropdown trasformazione (parseFloat, trim, ecc.)
- Preview real-time di 3 prodotti trasformati
- Salva mapping → vai a Step 3

**Step 3: Preview & Test**
- Mostra JSON generato per primi 5 prodotti
- Valida struttura
- Mostra statistiche (tot prodotti, campi mappati, ecc.)
- Bottone "Export Completo"

**Step 4: Export & Sync**
- Export manuale → genera products.json
- Setup sync automatico (webhook/cron)
- Storico export precedenti
- Log attività

### Styling (app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --primary: 263 70% 50%;
    --primary-foreground: 210 40% 98%;
  }
}

@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

body {
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
}
```

---

## 📦 PROGETTO 2: E-COMMERCE WEB

### Obiettivo
Shop online moderno che:
- Legge products.json generato dall'admin
- AI genera contenuti marketing per ogni prodotto
- Ricerca conversazionale intelligente
- Filtri dinamici su attributi
- Carrello Snipcart
- Email Brevo

### Stack Tecnologico
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn/ui
- @anthropic-ai/sdk (Claude AI)
- Snipcart (carrello)
- Brevo API (email)

### Inizializzazione

```bash
# Crea progetto
npx create-next-app@latest ecommerce-ai --typescript --tailwind --app --use-npm

cd ecommerce-ai

# Dipendenze
npm install @anthropic-ai/sdk
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge

# Shadcn/ui
npx shadcn-ui@latest init -d
npx shadcn-ui@latest add button card input dialog badge select slider separator toast skeleton
```

### Struttura File

```
ecommerce-ai/
├── app/
│   ├── layout.tsx                  # Root layout + Snipcart
│   ├── page.tsx                    # Homepage
│   ├── products/
│   │   ├── page.tsx               # Catalog page
│   │   └── [code]/
│   │       └── page.tsx           # Product detail
│   ├── search/
│   │   └── page.tsx               # Search results
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate/route.ts  # Generate product content
│   │   │   ├── search/route.ts    # AI conversational search
│   │   │   └── chat/route.ts      # AI chat interface
│   │   ├── products/
│   │   │   ├── route.ts           # Get all products
│   │   │   ├── [code]/route.ts    # Get single product
│   │   │   └── filters/route.ts   # Get filter options
│   │   └── webhook/
│   │       ├── snipcart/route.ts  # Snipcart order webhook
│   │       └── brevo/route.ts     # Email sending
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Header with search
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── products/
│   │   ├── ProductCard.tsx        # Product card with AI
│   │   ├── ProductGrid.tsx        # Grid layout
│   │   ├── ProductDetail.tsx      # Full product page
│   │   ├── FilterSidebar.tsx      # Dynamic filters
│   │   └── QuickView.tsx          # Modal quick view
│   ├── ai/
│   │   ├── AISearchBar.tsx        # Search with AI
│   │   ├── AIChat.tsx             # Chat interface
│   │   ├── AIBadge.tsx            # AI-generated badge
│   │   └── LoadingAI.tsx          # AI loading state
│   ├── cart/
│   │   ├── CartButton.tsx         # Cart icon + count
│   │   └── CartDrawer.tsx         # Slide-in cart
│   └── ui/                        # Shadcn components
│
├── lib/
│   ├── ai/
│   │   ├── claude.ts              # Claude API client
│   │   ├── cache.ts               # Cache management
│   │   ├── prompts.ts             # Prompt templates
│   │   └── rate-limit.ts          # Rate limiting
│   ├── db/
│   │   └── products.ts            # Products data access
│   ├── integrations/
│   │   ├── snipcart.ts            # Snipcart helpers
│   │   └── brevo.ts               # Brevo email API
│   └── utils.ts                   # Utility functions
│
├── data/
│   ├── products.json              # Generated by admin
│   └── ai-cache.json              # AI content cache
│
├── types/
│   └── index.ts
│
├── public/
│   ├── images/
│   │   └── placeholder.png
│   └── logo.svg
│
└── .env.local
```

### Environment Variables (.env.local)

```bash
# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Snipcart
NEXT_PUBLIC_SNIPCART_PUBLIC_KEY=your_public_key
SNIPCART_SECRET_KEY=your_secret_key

# Brevo
BREVO_API_KEY=xkeysib-xxxxx

# Cloudinary (opzionale)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Site
NEXT_PUBLIC_SITE_URL=https://shop.tuodominio.it

# Feature Flags
ENABLE_AI_CACHE=true
ENABLE_RATE_LIMITING=true
MAX_AI_SEARCHES_PER_HOUR=10
```

### Types (types/index.ts)

```typescript
export interface Product {
  codice: string;
  descrizione: string;
  prezzo: number;
  immagine?: string;
  attributi: Record<string, string | number>;
}

export interface AIGeneratedContent {
  titolo: string;
  descrizione: string;
  caratteristiche: string[];
  slogan: string;
  badge: string;
}

export interface ProductWithAI extends Product {
  aiContent?: AIGeneratedContent;
}

export interface AISearchResult {
  products: Product[];
  response: string;
  filters: string[];
}

export interface CacheEntry {
  productCode: string;
  content: AIGeneratedContent;
  timestamp: number;
  expiresAt: number;
}
```

### Funzionalità Chiave

#### 1. Products Data Access (lib/db/products.ts)

```typescript
import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/types';

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

export async function getAllProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.prodotti || [];
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function getProductByCode(code: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find(p => p.codice === code) || null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getAllProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => {
    if (p.descrizione.toLowerCase().includes(lowerQuery)) return true;
    
    return Object.values(p.attributi).some(val => 
      String(val).toLowerCase().includes(lowerQuery)
    );
  });
}

export async function getAvailableAttributes(): Promise<string[]> {
  const products = await getAllProducts();
  const attributes = new Set<string>();
  
  products.forEach(p => {
    Object.keys(p.attributi).forEach(key => attributes.add(key));
  });
  
  return Array.from(attributes).sort();
}

export async function getAttributeValues(attributeKey: string): Promise<string[]> {
  const products = await getAllProducts();
  const values = new Set<string>();
  
  products.forEach(p => {
    const val = p.attributi[attributeKey];
    if (val) values.add(String(val));
  });
  
  return Array.from(values).sort();
}

export async function filterProducts(filters: {
  priceMin?: number;
  priceMax?: number;
  attributes?: Record<string, string>;
}): Promise<Product[]> {
  const products = await getAllProducts();
  
  return products.filter(p => {
    if (filters.priceMin && p.prezzo < filters.priceMin) return false;
    if (filters.priceMax && p.prezzo > filters.priceMax) return false;
    
    if (filters.attributes) {
      for (const [key, value] of Object.entries(filters.attributes)) {
        if (p.attributi[key] !== value) return false;
      }
    }
    
    return true;
  });
}
```

#### 2. Claude AI Integration (lib/ai/claude.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Product, AIGeneratedContent } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export async function generateProductContent(
  product: Product
): Promise<AIGeneratedContent> {
  const attributesText = Object.entries(product.attributi)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const prompt = `Genera contenuto e-commerce professionale in italiano per questo prodotto.

Codice: ${product.codice}
Nome: ${product.descrizione}
Prezzo: €${product.prezzo}

Attributi prodotto:
${attributesText}

Rispondi SOLO con JSON valido (NO markdown, NO testo extra):
{
  "titolo": "titolo marketing accattivante (max 60 caratteri)",
  "descrizione": "descrizione persuasiva che evidenzia gli attributi del prodotto (3-4 frasi, 150-200 caratteri)",
  "caratteristiche": ["caratteristica 1", "caratteristica 2", "caratteristica 3", "caratteristica 4"],
  "slogan": "tagline d'impatto (max 50 caratteri)",
  "badge": "NUOVO | BESTSELLER | ESCLUSIVO | PREMIUM"
}

IMPORTANTE: 
- Usa TUTTI gli attributi forniti nella descrizione
- Tono professionale ma coinvolgente
- Focus su qualità e value proposition`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let cleaned = textContent.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Claude API Error:', error);
    
    // Fallback content
    return {
      titolo: product.descrizione,
      descrizione: 'Prodotto di qualità premium con caratteristiche eccezionali.',
      caratteristiche: [
        'Alta qualità',
        'Design moderno',
        'Garanzia inclusa',
        'Eccellente rapporto qualità/prezzo'
      ],
      slogan: 'Scopri l\'eccellenza',
      badge: 'NUOVO'
    };
  }
}

export async function aiSearch(
  query: string,
  products: Product[]
): Promise<{ prodotti_codici: string[]; risposta: string; filtri_suggeriti: string[] }> {
  const prompt = `Analizza questa richiesta utente e trova prodotti rilevanti nel catalogo.

Query utente: "${query}"

Catalogo prodotti (JSON):
${JSON.stringify(products.slice(0, 50), null, 2)}

Compito:
1. Comprendi l'intento dell'utente
2. Trova i prodotti più rilevanti
3. Ordina per rilevanza

Rispondi SOLO con JSON valido:
{
  "prodotti_codici": ["COD1", "COD2", "COD3"],
  "risposta": "Messaggio naturale e utile per l'utente che spiega i risultati trovati",
  "filtri_suggeriti": ["Filtro 1: Valore", "Filtro 2: Valore"]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response');
    }

    let cleaned = textContent.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('AI Search Error:', error);
    
    // Fallback: simple text search
    const lowerQuery = query.toLowerCase();
    const matching = products
      .filter(p => 
        p.descrizione.toLowerCase().includes(lowerQuery) ||
        Object.values(p.attributi).some(v => 
          String(v).toLowerCase().includes(lowerQuery)
        )
      )
      .slice(0, 10);

    return {
      prodotti_codici: matching.map(p => p.codice),
      risposta: `Ho trovato ${matching.length} prodotti che potrebbero interessarti.`,
      filtri_suggeriti: []
    };
  }
}
```

#### 3. AI Cache System (lib/ai/cache.ts)

```typescript
import fs from 'fs/promises';
import path from 'path';
import { CacheEntry, AIGeneratedContent } from '@/types';

const CACHE_FILE = path.join(process.cwd(), 'data', 'ai-cache.json');
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 giorni

export async function getFromCache(productCode: string): Promise<AIGeneratedContent | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache: CacheEntry[] = JSON.parse(data);
    
    const entry = cache.find(e => e.productCode === productCode);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.content;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function saveToCache(
  productCode: string,
  content: AIGeneratedContent
): Promise<void> {
  try {
    let cache: CacheEntry[] = [];
    
    try {
      const data = await fs.readFile(CACHE_FILE, 'utf-8');
      cache = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }
    
    // Remove old entry if exists
    cache = cache.filter(e => e.productCode !== productCode);
    
    // Add new entry
    cache.push({
      productCode,
      content,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    });
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

export async function clearExpiredCache(): Promise<number> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache: CacheEntry[] = JSON.parse(data);
    
    const validCache = cache.filter(e => e.expiresAt > Date.now());
    const removedCount = cache.length - validCache.length;
    
    if (removedCount > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(validCache, null, 2));
    }
    
    return removedCount;
  } catch (error) {
    return 0;
  }
}
```

#### 4. Snipcart Integration (app/layout.tsx)

```typescript
import Script from 'next/script';
import './globals.css';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.css"
        />
      </head>
      <body>
        {children}
        
        {/* Snipcart */}
        <div
          id="snipcart"
          data-api-key={process.env.NEXT_PUBLIC_SNIPCART_PUBLIC_KEY}
          data-config-modal-style="side"
          hidden
        />
        
        <Script
          src="https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

#### 5. Brevo Email Integration (lib/integrations/brevo.ts)

```typescript
export interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: EmailParams) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Shop AI',
        email: 'noreply@tuodominio.it'
      },
      to: [{ email: to }],
      subject,
      htmlContent
    })
  });

  if (!response.ok) {
    throw new Error(`Brevo API Error: ${response.status}`);
  }

  return response.json();
}

export async function sendOrderConfirmation(order: any) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .order-items { background: white; padding: 20px; margin: 20px 0; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Grazie per il tuo ordine!</h1>
        </div>
        <div class="content">
          <p>Ciao ${order.email},</p>
          <p>Abbiamo ricevuto il tuo ordine <strong>#${order.invoiceNumber}</strong></p>
          
          <div class="order-items">
            <h3>Riepilogo Ordine:</h3>
            ${order.items.map((item: any) => `
              <div class="item">
                <strong>${item.name}</strong> x${item.quantity}<br>
                €${item.price.toFixed(2)}
              </div>
            `).join('')}
            
            <div class="total">
              Totale: €${order.total.toFixed(2)}
            </div>
          </div>
          
          <p>Riceverai un'email di conferma spedizione appena il tuo ordine sarà in viaggio.</p>
          <p>Per qualsiasi domanda, rispondi a questa email.</p>
        </div>
        <div class="footer">
          <p>© 2025 Shop AI - Tutti i diritti riservati</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.email,
    subject: `Ordine confermato #${order.invoiceNumber}`,
    htmlContent: html
  });
}
```

---

## 🎨 DESIGN SYSTEM

### Palette Colori

```css
/* Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-dark: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);

/* Base Colors */
--bg-primary: #0f0f1e;
--bg-secondary: #1a1a2e;
--bg-glass: rgba(255, 255, 255, 0.05);
--text-primary: #ffffff;
--text-secondary: #a0a0b8;
--accent: #667eea;
--accent-hover: #764ba2;
--border-glass: rgba(255, 255, 255, 0.18);
```

### Componenti UI Principali

#### ProductCard Component (components/products/ProductCard.tsx)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingCart, Loader2 } from 'lucide-react';
import { ProductWithAI } from '@/types';

interface ProductCardProps {
  product: ProductWithAI;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [aiContent, setAiContent] = useState(product.aiContent);
  const [loading, setLoading] = useState(!product.aiContent);

  useEffect(() => {
    if (!aiContent) {
      fetchAIContent();
    }
  }, []);

  async function fetchAIContent() {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCode: product.codice })
      });
      
      const data = await res.json();
      setAiContent(data.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 group">
      {/* Badge */}
      {aiContent?.badge && (
        <Badge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-500 to-pink-500">
          {aiContent.badge}
        </Badge>
      )}
      
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
        {product.immagine ? (
          <img
            src={product.immagine}
            alt={product.descrizione}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="w-16 h-16 text-white/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-white text-lg line-clamp-2">
              {aiContent?.titolo || product.descrizione}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {aiContent?.descrizione}
            </p>
            
            {aiContent?.slogan && (
              <p className="text-purple-400 text-xs italic">
                "{aiContent.slogan}"
              </p>
            )}
          </>
        )}
        
        {/* Price & Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            €{product.prezzo.toFixed(2)}
          </span>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 snipcart-add-item"
            data-item-id={product.codice}
            data-item-price={product.prezzo}
            data-item-name={aiContent?.titolo || product.descrizione}
            data-item-description={aiContent?.descrizione}
            data-item-image={product.immagine}
            data-item-url={`/api/products/${product.codice}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

#### AISearchBar Component (components/ai/AISearchBar.tsx)

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Loader2 } from 'lucide-react';

export default function AISearchBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      
      // Redirect to results page
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Prova: "cerco un regalo elegante per mia moglie"'
          className="pl-12 pr-32 py-6 text-lg glass border-white/20 text-white placeholder-gray-400"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cerco...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Cerca con AI
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        💡 Descrivi cosa cerchi in modo naturale - l'AI capirà!
      </p>
    </form>
  );
}
```

#### FilterSidebar Component (components/products/FilterSidebar.tsx)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function FilterSidebar() {
  const [attributes, setAttributes] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    const res = await fetch('/api/products/filters');
    const data = await res.json();
    setAttributes(data.attributes);
    setPriceRange([data.minPrice, data.maxPrice]);
  }

  function toggleFilter(attributeKey: string, value: string) {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[attributeKey]) {
        newFilters[attributeKey] = new Set();
      }
      
      if (newFilters[attributeKey].has(value)) {
        newFilters[attributeKey].delete(value);
      } else {
        newFilters[attributeKey].add(value);
      }
      
      return newFilters;
    });
  }

  function resetFilters() {
    setSelectedFilters({});
    setPriceRange([0, 1000]);
  }

  return (
    <Card className="glass p-6 space-y-6 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Filtri</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Resetta
        </Button>
      </div>

      <Separator className="bg-white/10" />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Prezzo</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={1000}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>€{priceRange[0]}</span>
          <span>€{priceRange[1]}</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Dynamic Attribute Filters */}
      {Object.entries(attributes).map(([key, values]) => (
        <div key={key} className="space-y-3">
          <Label className="text-white font-semibold capitalize">
            {key.replace('_', ' ')}
          </Label>
          <div className="space-y-2">
            {values.map(value => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${key}-${value}`}
                  checked={selectedFilters[key]?.has(value) || false}
                  onCheckedChange={() => toggleFilter(key, value)}
                />
                <label
                  htmlFor={`${key}-${value}`}
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  {value}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
        Applica Filtri
      </Button>
    </Card>
  );
}
```

---

## 🔗 API ROUTES PRINCIPALI

### Generate AI Content (app/api/ai/generate/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getProductByCode } from '@/lib/db/products';
import { generateProductContent } from '@/lib/ai/claude';
import { getFromCache, saveToCache } from '@/lib/ai/cache';

export async function POST(request: NextRequest) {
  try {
    const { productCode } = await request.json();
    
    if (!productCode) {
      return NextResponse.json(
        { error: 'Product code required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getFromCache(productCode);
    if (cached) {
      return NextResponse.json({
        content: cached,
        cached: true
      });
    }

    // Get product
    const product = await getProductByCode(productCode);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate AI content
    const content = await generateProductContent(product);

    // Save to cache
    await saveToCache(productCode, content);

    return NextResponse.json({
      content,
      cached: false
    });
  } catch (error: any) {
    console.error('Generate AI Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
```

### AI Search (app/api/ai/search/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db/products';
import { aiSearch } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query required' },
        { status: 400 }
      );
    }

    const products = await getAllProducts();
    const result = await aiSearch(query, products);

    // Get full product objects
    const foundProducts = products.filter(p =>
      result.prodotti_codici.includes(p.codice)
    );

    return NextResponse.json({
      products: foundProducts,
      response: result.risposta,
      filters: result.filtri_suggeriti,
      query
    });
  } catch (error: any) {
    console.error('AI Search Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Snipcart Webhook (app/api/webhook/snipcart/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmation } from '@/lib/integrations/brevo';

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();

    // Verify webhook signature (production)
    // const signature = request.headers.get('x-snipcart-signature');
    // ... verify signature ...

    // Send confirmation email
    await sendOrderConfirmation(order);

    // Log order for analytics
    console.log('New order:', order.invoiceNumber, order.total);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📱 HOMEPAGE (app/page.tsx)

```typescript
import { getAllProducts } from '@/lib/db/products';
import Header from '@/components/layout/Header';
import AISearchBar from '@/components/ai/AISearchBar';
import ProductGrid from '@/components/products/ProductGrid';
import { Sparkles } from 'lucide-react';

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
            <h1 className="text-5xl font-bold text-white">
              Shop Intelligente con AI
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Trova prodotti perfetti parlando naturalmente. 
            L'intelligenza artificiale capisce cosa cerchi.
          </p>

          <AISearchBar />
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              Il Nostro Catalogo
            </h2>
            <p className="text-gray-400">
              {products.length} prodotti disponibili
            </p>
          </div>

          <ProductGrid products={products} />
        </div>
      </section>
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Admin Dashboard
cd admin-dashboard
vercel --prod

# Deploy E-Commerce
cd ../ecommerce-ai
vercel --prod
```

### Environment Variables su Vercel

Per entrambi i progetti, vai su Vercel Dashboard → Settings → Environment Variables e aggiungi tutte le variabili del file `.env.local`.

### Custom Domains

```bash
# Admin
vercel domains add admin.tuodominio.it

# E-commerce
vercel domains add shop.tuodominio.it
```

Su Siteground DNS, aggiungi:
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com

Type: CNAME
Name: shop
Value: cname.vercel-dns.com
```

---

## ✅ CHECKLIST SVILUPPO

### Admin Dashboard
- [ ] Setup progetto Next.js
- [ ] Installa dipendenze
- [ ] Crea struttura file
- [ ] Implementa connessione MySQL
- [ ] UI form connessione DB
- [ ] API route test connection
- [ ] API route get tables/columns
- [ ] UI mapping interface
- [ ] Sistema trasformazioni dati
- [ ] Preview JSON generator
- [ ] Export products.json
- [ ] Sync automatico (webhook)
- [ ] Styling glassmorphism
- [ ] Test con database reale

### E-Commerce Web
- [ ] Setup progetto Next.js
- [ ] Installa dipendenze
- [ ] Crea struttura file
- [ ] Products data access layer
- [ ] Claude AI integration
- [ ] Cache system
- [ ] API generate content
- [ ] API AI search
- [ ] ProductCard component
- [ ] AISearchBar component
- [ ] FilterSidebar component
- [ ] Homepage layout
- [ ] Product detail page
- [ ] Snipcart integration
- [ ] Brevo email integration
- [ ] Webhook Snipcart
- [ ] Styling glassmorphism
- [ ] Mobile responsive
- [ ] Test end-to-end

### Deploy
- [ ] Deploy admin su Vercel
- [ ] Deploy e-commerce su Vercel
- [ ] Configura custom domains
- [ ] Setup DNS su Siteground
- [ ] Test produzione
- [ ] Monitoring attivo

---

## 🐛 TROUBLESHOOTING

### Database Connection Error
```bash
# Verifica credenziali
# Verifica che IP Vercel sia whitelistato su Siteground
# Prova connessione locale prima
```

### Claude API Rate Limit
```bash
# Implementa rate limiting
# Usa cache aggressivamente
# Fallback content se necessario
```

### Build Errors
```bash
# Pulisci cache
rm -rf .next
npm run build

# Type errors
npx tsc --noEmit
```

---

## 📚 COMANDI UTILI

```bash
# Sviluppo
npm run dev

# Build
npm run build

# Start produzione
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Clean
rm -rf .next node_modules
npm install
```

---

## 🎯 PRIORITÀ IMPLEMENTAZIONE

### Settimana 1: Admin Dashboard
1. Setup e struttura base
2. Connessione database
3. Mapping interface
4. Export JSON

### Settimana 2-3: E-Commerce Base
1. Setup e struttura
2. Products display
3. AI integration base
4. Snipcart cart

### Settimana 4: Features Avanzate
1. AI search
2. Filtri dinamici
3. Email automation
4. Polish UI/UX

### Settimana 5: Testing & Launch
1. Test completi
2. Fix bugs
3. Deploy produzione
4. Monitoring

---

## 💡 NOTE IMPORTANTI

1. **Database Read-Only**: Admin legge solo, non modifica DB
2. **Cache Cruciale**: Risparmia 70% costi AI
3. **JSON è Source**: E-commerce legge solo JSON, non DB diretto
4. **Attributi Dinamici**: Aggiungi campi senza modificare codice
5. **Mobile First**: Design responsive prioritario
6. **Error Handling**: Fallback sempre disponibili
7. **Security**: Proteggi admin con autenticazione
8. **Performance**: Lazy loading, prefetch, ottimizzazioni

---

## 🚀 READY TO BUILD!

Questo documento contiene TUTTO il necessario per sviluppare il sistema completo.

**Ordine Sviluppo:**
1. Inizia con Admin Dashboard
2. Testa connessione DB reale
3. Genera primo products.json
4. Sviluppa E-Commerce
5. Integra AI
6. Deploy e test

**IMPORTANTE:** Testa ogni componente prima di procedere al successivo!

Buon sviluppo! 🎉