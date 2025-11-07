# 🚀 GUIDA AL DEPLOYMENT

Questo progetto usa **due sistemi di deploy separati**:

- **Frontend** (Next.js) → Vercel (automatico)
- **Backend** (PHP) → SiteGround (manuale o script)

---

## 📦 FRONTEND → VERCEL (Automatico)

### Come funziona:

```
Git Push → GitHub → Vercel Auto-Deploy → Live!
```

**Fatto!** Ogni push su `main` deploya automaticamente il frontend.

**URL:** https://tuo-sito.vercel.app

---

## 🔧 BACKEND → SITEGROUND (Script Automatico)

### Prima Configurazione (una volta sola):

1. **Configura la password FTP in modo sicuro:**

   Apri PowerShell e esegui:

   ```powershell
   [System.Environment]::SetEnvironmentVariable('SITEGROUND_FTP_PASSWORD', 'tua-password-ftp', 'User')
   ```

   ⚠️ **Sostituisci `tua-password-ftp` con la tua vera password FTP**

2. **Verifica configurazione:**

   ```powershell
   $env:SITEGROUND_FTP_PASSWORD
   # Dovrebbe mostrare la tua password
   ```

---

### Deploy Backend:

Ogni volta che modifichi file in `admin/`, esegui:

```powershell
cd C:\Users\pelli\claude\ecommerce
.\deploy-to-siteground.ps1
```

**Lo script farà:**
- ✅ Carica automaticamente tutti i file `admin/` su SiteGround
- ✅ Ignora file temporanei e log
- ✅ Mostra progress in tempo reale
- ✅ Conferma operazione prima di procedere

---

## 🔐 SICUREZZA

### Password FTP:

- ✅ **Mai committata su Git**
- ✅ Salvata in variabile d'ambiente Windows
- ✅ Accessibile solo dal tuo account

### File Ignorati (.gitignore):

```
✅ .env.local (con ADMIN_API_TOKEN)
✅ *.log, *.backup
✅ admin/data/ai-descriptions/
✅ admin/data/logs/
✅ SESSION_NOTES.md
✅ File temporanei
```

---

## 📋 WORKFLOW COMPLETO

### Sviluppo e Deploy:

1. **Lavora in locale:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Commit modifiche:**
   ```bash
   git add .
   git commit -m "Descrizione modifiche"
   git push
   ```

3. **Frontend:**
   - ✅ Vercel deploya automaticamente

4. **Backend (se hai modificato admin/):**
   ```powershell
   .\deploy-to-siteground.ps1
   ```

---

## 🆘 TROUBLESHOOTING

### Errore: "Password FTP non configurata"

**Soluzione:**
```powershell
[System.Environment]::SetEnvironmentVariable('SITEGROUND_FTP_PASSWORD', 'tua-password', 'User')
```

### Errore: "Connessione FTP fallita"

**Verifica:**
- Password corretta
- Host: `ftp.didieffeb2b.com`
- Porta: `21`
- Firewall non blocca porta 21

### File non caricati

**Controlla:**
- File non in `.gitignore`
- Permessi FTP corretti su SiteGround

---

## 🔗 LINK UTILI

- **Frontend (Vercel):** https://vercel.com/dashboard
- **Backend (SiteGround):** https://shop.didieffeb2b.com/admin/
- **Repository GitHub:** https://github.com/pellizzariandrea-art/didieffeb2c

---

## 📞 SUPPORTO

Se hai problemi:
1. Verifica i log dello script
2. Controlla connessione FTP manualmente (FileZilla)
3. Verifica permessi su SiteGround

---

🤖 Generato con [Claude Code](https://claude.com/claude-code)
