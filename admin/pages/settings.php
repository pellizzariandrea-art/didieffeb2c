<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Carica o inizializza settings
$settingsFile = DATA_PATH . '/translation-settings.json';
$settings = [
    'enabled' => false,
    'languages' => ['it'], // IT sempre incluso come base
    'translate_name' => true,
    'translate_description' => true,
    'translate_attributes' => true,
    'api_key' => '',
    'translation_model' => 'claude-haiku-4-5-20251001', // Per traduzioni (economico)
    'ai_model' => 'claude-sonnet-4-5-20250929', // Per descrizioni AI (qualità - Sonnet 4.5)
    'ai_description_enabled' => false,
    'ai_description_prompt' => ''
];

if (file_exists($settingsFile)) {
    $saved = json_decode(file_get_contents($settingsFile), true);
    if ($saved) {
        $settings = array_merge($settings, $saved);
    }
}

// Salva settings
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_settings') {
    $settings['enabled'] = isset($_POST['enabled']);
    $settings['languages'] = $_POST['languages'] ?? ['it'];
    $settings['translate_name'] = isset($_POST['translate_name']);
    $settings['translate_description'] = isset($_POST['translate_description']);
    $settings['translate_attributes'] = isset($_POST['translate_attributes']);
    $settings['api_key'] = trim($_POST['api_key'] ?? '');
    $settings['translation_model'] = trim($_POST['translation_model'] ?? 'claude-haiku-4-5-20251001');
    $settings['ai_model'] = trim($_POST['ai_model'] ?? 'claude-sonnet-4-5-20250929');
    $settings['ai_description_enabled'] = isset($_POST['ai_description_enabled']);
    $settings['ai_description_prompt'] = trim($_POST['ai_description_prompt'] ?? '');

    file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT));
    logActivity("Impostazioni traduzioni aggiornate");

    $message = 'Impostazioni salvate con successo!';
    $messageType = 'success';
}

include '../includes/header.php';
?>

<div class="card">
    <h2>⚙️ Impostazioni Traduzioni</h2>
    <p style="color: #a0a0b8;">Configura il sistema di traduzioni automatiche per l'export multilingua.</p>

    <?php if (isset($message)): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="action" value="save_settings">

        <div class="form-group">
            <label>
                <input type="checkbox" name="enabled" value="1" <?php echo $settings['enabled'] ? 'checked' : ''; ?>>
                <strong>Abilita Traduzioni Automatiche</strong>
            </label>
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                Se disabilitato, l'export genererà solo la lingua italiana (base)
            </small>
        </div>

        <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;">

        <h3 style="color: #667eea; margin-bottom: 15px;">Lingue Target</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">
            Seleziona le lingue in cui tradurre i contenuti. <strong>Italiano</strong> è sempre incluso come lingua base.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="it" checked disabled>
                    <span>🇮🇹 Italiano (base)</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="en" <?php echo in_array('en', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇬🇧 Inglese</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="de" <?php echo in_array('de', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇩🇪 Tedesco</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="fr" <?php echo in_array('fr', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇫🇷 Francese</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="es" <?php echo in_array('es', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇪🇸 Spagnolo</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="pt" <?php echo in_array('pt', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇵🇹 Portoghese</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="hr" <?php echo in_array('hr', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇭🇷 Croato</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="sl" <?php echo in_array('sl', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇸🇮 Sloveno</span>
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="el" <?php echo in_array('el', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇬🇷 Greco</span>
                </label>
            </div>
            <!-- ⬇️ AGGIUNGI ALTRE LINGUE QUI -->
            <!-- ESEMPIO: Russo -->
            <!--
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="ru" <?php echo in_array('ru', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇷🇺 Russo</span>
                </label>
            </div>
            -->
            <!-- ESEMPIO: Cinese -->
            <!--
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="zh" <?php echo in_array('zh', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇨🇳 Cinese</span>
                </label>
            </div>
            -->
            <!-- ESEMPIO: Giapponese -->
            <!--
            <div>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" name="languages[]" value="ja" <?php echo in_array('ja', $settings['languages']) ? 'checked' : ''; ?>>
                    <span>🇯🇵 Giapponese</span>
                </label>
            </div>
            -->
        </div>

        <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;">

        <h3 style="color: #667eea; margin-bottom: 15px;">Cosa Tradurre</h3>

        <div class="form-group">
            <label>
                <input type="checkbox" name="translate_name" value="1" <?php echo $settings['translate_name'] ? 'checked' : ''; ?>>
                <strong>Nome Prodotto</strong>
            </label>
        </div>

        <div class="form-group">
            <label>
                <input type="checkbox" name="translate_description" value="1" <?php echo $settings['translate_description'] ? 'checked' : ''; ?>>
                <strong>Descrizione Prodotto</strong>
            </label>
        </div>

        <div class="form-group">
            <label>
                <input type="checkbox" name="translate_attributes" value="1" <?php echo $settings['translate_attributes'] ? 'checked' : ''; ?>>
                <strong>Attributi (Label + Value testuali)</strong>
            </label>
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                Traduce sia il nome dell'attributo (es: "Materiale" → "Material") che il valore (es: "Acciaio" → "Steel")
            </small>
        </div>

        <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;">

        <h3 style="color: #667eea; margin-bottom: 15px;">API Claude (Anthropic)</h3>
        <p style="color: #a0a0b8; margin-bottom: 15px;">
            Inserisci la tua API Key di Claude per abilitare le traduzioni automatiche.
            <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #667eea;">Ottieni una chiave qui</a>
        </p>

        <div class="form-group">
            <label>API Key</label>
            <input type="password" name="api_key" placeholder="sk-ant-api03-..."
                value="<?php echo htmlspecialchars($settings['api_key']); ?>">
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                La chiave viene salvata in modo sicuro nel server
            </small>
        </div>

        <div class="form-group">
            <label>🌍 Modello per Traduzioni</label>
            <input type="text" name="translation_model" placeholder="claude-haiku-4-5-20251001"
                value="<?php echo htmlspecialchars($settings['translation_model'] ?? 'claude-haiku-4-5-20251001'); ?>">
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                💰 Usa <strong>Haiku</strong> per traduzioni economiche ($1/MTok - 70% risparmio). <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" style="color: #667eea;">Confronto modelli</a>
            </small>
        </div>

        <div class="form-group">
            <label>🎨 Modello per Descrizioni AI</label>
            <input type="text" name="ai_model" placeholder="claude-sonnet-4-5-20250929"
                value="<?php echo htmlspecialchars($settings['ai_model'] ?? 'claude-sonnet-4-5-20250929'); ?>">
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                ✨ Usa <strong>Sonnet 4.5</strong> per testi marketing di qualità ($3/MTok). <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" style="color: #667eea;">Confronto modelli</a>
            </small>
        </div>

        <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;">

        <h3 style="color: #667eea; margin-bottom: 15px;">🎨 Descrizioni AI per E-commerce</h3>
        <p style="color: #a0a0b8; margin-bottom: 15px;">
            Genera automaticamente descrizioni qualificate per i prodotti usando l'AI. Le descrizioni vengono salvate e riutilizzate.
        </p>

        <div class="form-group">
            <label>
                <input type="checkbox" name="ai_description_enabled" value="1" <?php echo $settings['ai_description_enabled'] ? 'checked' : ''; ?>>
                <strong>Abilita Descrizioni AI</strong>
            </label>
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                Genera descrizioni HTML arricchite per ogni prodotto con suggerimenti automatici
            </small>
        </div>

        <div class="form-group">
            <label>Prompt per Generazione Descrizioni</label>
            <textarea name="ai_description_prompt" rows="12" placeholder="Inserisci il prompt per generare le descrizioni..."
                style="width: 100%; padding: 12px; background: #2a2a40; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0f0; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6;"><?php echo htmlspecialchars($settings['ai_description_prompt']); ?></textarea>
            <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                Usa le variabili: {codice}, {nome}, {descrizione}, {immagine}, {serie}, {materiale}, {colore}, {categoria}, {tipologia}, {lingua}
            </small>
        </div>

        <div style="margin-top: 30px;">
            <button type="submit" class="btn">💾 Salva Impostazioni</button>
        </div>
    </form>
</div>

<div class="card">
    <h3>📊 Stima Costi Traduzioni</h3>
    <p style="color: #a0a0b8; margin-bottom: 20px;">
        Costi stimati per traduzione con Claude (modello Claude Sonnet):
    </p>

    <table>
        <thead>
            <tr>
                <th>Scenario</th>
                <th>Token</th>
                <th>Costo</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1 prodotto, 1 lingua</td>
                <td>~500</td>
                <td>$0.0015</td>
            </tr>
            <tr>
                <td>100 prodotti, 1 lingua</td>
                <td>~50.000</td>
                <td>$0.15</td>
            </tr>
            <tr>
                <td>100 prodotti, 3 lingue (EN, DE, FR)</td>
                <td>~150.000</td>
                <td>$0.45</td>
            </tr>
            <tr>
                <td>1000 prodotti, 3 lingue</td>
                <td>~1.500.000</td>
                <td>$4.50</td>
            </tr>
        </tbody>
    </table>

    <div class="alert alert-warning" style="margin-top: 20px;">
        💡 <strong>Tip:</strong> Le traduzioni vengono cachate. Export successivi costano ~90% in meno!
    </div>
</div>

<?php include '../includes/footer.php'; ?>
