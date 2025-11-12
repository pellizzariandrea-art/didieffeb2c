// app/api/translations/save/route.ts
// API endpoint to save ui-labels.json

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = process.env.ADMIN_API_TOKEN;

    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { translations } = body;

    if (!translations || typeof translations !== 'object') {
      return NextResponse.json(
        { error: 'Invalid translations data' },
        { status: 400 }
      );
    }

    // Backup current file
    const configPath = path.join(process.cwd(), 'config', 'ui-labels.json');
    const backupPath = path.join(
      process.cwd(),
      'config',
      `ui-labels.backup-${Date.now()}.json`
    );

    const currentContent = await readFile(configPath, 'utf-8');
    await writeFile(backupPath, currentContent, 'utf-8');

    // Save new translations
    const newContent = JSON.stringify(translations, null, 2);
    await writeFile(configPath, newContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Translations saved successfully',
      backup: path.basename(backupPath)
    });

  } catch (error) {
    console.error('Error saving translations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save translations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'ui-labels.json');
    const content = await readFile(configPath, 'utf-8');
    const translations = JSON.parse(content);

    return NextResponse.json({
      success: true,
      translations
    });

  } catch (error) {
    console.error('Error reading translations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read translations'
      },
      { status: 500 }
    );
  }
}
