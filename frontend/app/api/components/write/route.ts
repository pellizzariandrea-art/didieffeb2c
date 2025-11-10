// API per scrivere file componenti
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.join(process.cwd(), 'components', 'reports');

const ALLOWED_COMPONENTS = [
  'ReportTable',
  'ReportFilters',
  'ReportExport',
  'ReportBuilder',
];

// POST - Write component file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, code } = body;

    if (!component || !code) {
      return NextResponse.json(
        { error: 'Missing component or code' },
        { status: 400 }
      );
    }

    // Security: only allow whitelisted components
    if (!ALLOWED_COMPONENTS.includes(component)) {
      return NextResponse.json(
        { error: 'Component not allowed' },
        { status: 403 }
      );
    }

    // Basic validation: code must start with 'use client', import, or comment (separatori multi-componente)
    const trimmedCode = code.trim();
    if (!trimmedCode.startsWith("'use client'") &&
        !trimmedCode.startsWith('"use client"') &&
        !trimmedCode.startsWith('import') &&
        !trimmedCode.startsWith('//')) {
      return NextResponse.json(
        { error: 'Invalid component code format' },
        { status: 400 }
      );
    }

    // Write file
    const filePath = path.join(COMPONENTS_DIR, `${component}.tsx`);

    // Create backup of current version
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(COMPONENTS_DIR, `${component}.backup.tsx`);
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, code, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Component updated successfully',
      path: filePath,
    });
  } catch (error: any) {
    console.error('Error writing component:', error);
    return NextResponse.json(
      { error: 'Failed to write component: ' + error.message },
      { status: 500 }
    );
  }
}

// GET - Read component file
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const component = searchParams.get('component');

    if (!component) {
      return NextResponse.json(
        { error: 'Missing component parameter' },
        { status: 400 }
      );
    }

    if (!ALLOWED_COMPONENTS.includes(component)) {
      return NextResponse.json(
        { error: 'Component not allowed' },
        { status: 403 }
      );
    }

    const filePath = path.join(COMPONENTS_DIR, `${component}.tsx`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Component file not found' },
        { status: 404 }
      );
    }

    const code = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({
      success: true,
      component,
      code,
    });
  } catch (error: any) {
    console.error('Error reading component:', error);
    return NextResponse.json(
      { error: 'Failed to read component' },
      { status: 500 }
    );
  }
}
