# 🚀 Quick Deploy Guide

## TL;DR - Deployment Veloce

### 📦 Su SiteGround (PHP Backend)

Carica via FTP/SFTP:

```
✅ /admin/         (TUTTA la cartella)
✅ /data/
✅ /risorse/
✅ /risorse_download/
✅ /scripts/
```

❌ **NON caricare:** `/frontend/`, `/node_modules/`, `.git/`, `.env`

---

### ⚙️ Configurazione

1. **Copia credenziali database:**
   ```bash
   cp admin/config.example.php admin/config.php
   ```

2. **Modifica `admin/config.php`:**
   ```php
   define('DB_NAME', 'il_tuo_database');
   define('DB_USER', 'il_tuo_user');
   define('DB_PASS', 'la_tua_password');
   ```

3. **CHMOD su SiteGround:**
   ```
   /admin/data/  → 755
   /data/        → 755
   ```

4. **Testa:**
   ```
   https://shop.didieffeb2b.com/admin/
   https://shop.didieffeb2b.com/data/products.json
   ```

---

### 🌐 Frontend Next.js (Vercel/Netlify)

```bash
cd frontend/
vercel --prod
```

Configura variabili ambiente:
```
NEXT_PUBLIC_API_URL=https://shop.didieffeb2b.com
```

---

## 📚 Guide Complete

- **Deploy SiteGround:** Leggi `DEPLOY_SITEGROUND.md`
- **Aggiungere Lingue:** Leggi `GUIDA_AGGIUNGERE_LINGUE.md`
- **Progetto Completo:** Leggi `note_progetto.md`

---

## 🔐 Sicurezza

⚠️ **NON committare su Git:**
- `admin/config.php`
- `*firebase-adminsdk*.json`
- `admin/data/translation-settings.json`

✅ Usa `.gitignore` già configurato

---

## 🐛 Problemi?

1. **500 Error:** Controlla CHMOD e `.htaccess`
2. **DB Error:** Verifica credenziali in `config.php`
3. **Permission Denied:** CHMOD 755 su `/admin/data/`

---

**Deploy checklist completa:** Vedi `DEPLOY_SITEGROUND.md`
