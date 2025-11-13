    // TRANSLATE METADATA if skip_translations was enabled (fast export)
    if ($skipTranslations && !empty($translationSettings['api_key'])) {
        $apiKey = $translationSettings['api_key'];
        $targetLanguages = $translationSettings['languages'] ?? ['en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

        // Count total items to translate for progress bar
        $totalCategories = !empty($jsonData['_meta']['categories']) ? count($jsonData['_meta']['categories']) : 0;
        $totalFilters = 0;
        $totalFilterOptions = 0;

        if (!empty($jsonData['_meta']['filters'])) {
            foreach ($jsonData['_meta']['filters'] as $filter) {
                if ($filter['type'] !== 'range' && !empty($filter['options'])) {
                    $totalFilters++;
                    $totalFilterOptions += count($filter['options']);
                }
            }
        }

        $totalItems = $totalCategories + $totalFilterOptions;
        $currentItem = 0;

        sendSSE('progress', [
            'phase' => 'translating_metadata',
            'message' => "📝 Inizio traduzione metadata: {$totalCategories} categorie, {$totalFilters} filtri ({$totalFilterOptions} opzioni)",
            'current' => 0,
            'total' => $totalItems,
            'percent' => 94
        ]);

        writeLog("Translating metadata: {$totalCategories} categories, {$totalFilters} filters ({$totalFilterOptions} options)");

        // Translate categories
        if (!empty($jsonData['_meta']['categories'])) {
            $categoryIndex = 0;
            foreach ($jsonData['_meta']['categories'] as &$category) {
                $categoryIndex++;
                $categoryName = $category['field'] ?? $category['label'] ?? '';

                if ($categoryName && (!isset($category['translations']) || count($category['translations']) <= 1)) {
                    sendSSE('progress', [
                        'phase' => 'translating_metadata',
                        'message' => "🏷️ Categoria {$categoryIndex}/{$totalCategories}: \"{$categoryName}\"",
                        'current' => $currentItem,
                        'total' => $totalItems,
                        'percent' => 94 + (int)(($currentItem / $totalItems) * 3)
                    ]);

                    $category['translations'] = $category['translations'] ?? [];

                    if (!isset($category['translations']['it'])) {
                        $category['translations']['it'] = $categoryName;
                    }

                    foreach ($targetLanguages as $lang) {
                        if ($lang === 'it') continue;

                        if (empty($category['translations'][$lang])) {
                            $category['translations'][$lang] = translateText($categoryName, $lang, $apiKey);
                            usleep(100000); // 100ms pause
                        }
                    }

                    $currentItem++;
                }
            }
            unset($category);
        }

        // Translate filters
        if (!empty($jsonData['_meta']['filters'])) {
            $filterIndex = 0;
            foreach ($jsonData['_meta']['filters'] as &$filter) {
                $filterName = $filter['field'] ?? $filter['label'] ?? '';

                // Skip range filters
                if ($filter['type'] === 'range') continue;

                $filterIndex++;

                // Translate filter options
                if (!empty($filter['options']) && is_array($filter['options'])) {
                    $optionIndex = 0;
                    $totalOptionsInFilter = count($filter['options']);

                    foreach ($filter['options'] as &$option) {
                        $optionIndex++;
                        $currentItem++;

                        // Get option value for display
                        $optionValue = '';
                        if (isset($option['value'])) {
                            if (is_array($option['value'])) {
                                $optionValue = $option['value']['it'] ?? '';
                            } elseif (is_bool($option['value'])) {
                                $optionValue = $option['value'] ? 'Sì' : 'No';
                            } else {
                                $optionValue = $option['value'];
                            }
                        }

                        sendSSE('progress', [
                            'phase' => 'translating_metadata',
                            'message' => "🔧 Filtro {$filterIndex}/{$totalFilters} \"{$filterName}\" - Opzione {$optionIndex}/{$totalOptionsInFilter}: \"{$optionValue}\"",
                            'current' => $currentItem,
                            'total' => $totalItems,
                            'percent' => 94 + (int)(($currentItem / $totalItems) * 3)
                        ]);

                        // Translate label
                        if (!is_array($option['label'])) {
                            $option['label'] = ['it' => $filterName];
                        }

                        foreach ($targetLanguages as $lang) {
                            if ($lang === 'it') continue;

                            if (empty($option['label'][$lang])) {
                                $option['label'][$lang] = translateText($filterName, $lang, $apiKey);
                                usleep(50000);
                            }
                        }

                        // Translate value (only if it's a multilingual object with strings, not booleans!)
                        if (isset($option['value']) && is_array($option['value'])) {
                            $italianValue = $option['value']['it'] ?? '';

                            if ($italianValue && is_string($italianValue)) {
                                foreach ($targetLanguages as $lang) {
                                    if ($lang === 'it') continue;

                                    if (empty($option['value'][$lang])) {
                                        $option['value'][$lang] = translateText($italianValue, $lang, $apiKey);
                                        usleep(50000);
                                    }
                                }
                            }
                        }
                    }
                    unset($option);
                }
            }
            unset($filter);
        }

        sendSSE('progress', [
            'phase' => 'translating_metadata',
            'message' => "✅ Traduzione metadata completata: {$totalCategories} categorie + {$totalFilterOptions} opzioni filtri",
            'current' => $totalItems,
            'total' => $totalItems,
            'percent' => 97
        ]);

        writeLog("Metadata translation completed: {$totalCategories} categories + {$totalFilterOptions} filter options");
    }
