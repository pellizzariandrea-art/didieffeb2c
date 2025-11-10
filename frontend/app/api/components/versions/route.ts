// API per gestione versioni componenti UI
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VERSIONS_FILE = path.join(process.cwd(), '..', 'admin', 'data', 'component-versions.json');

interface ComponentVersion {
  id: string;
  timestamp: string;
  note: string;
  code: string;
}

interface ComponentVersions {
  active: string;
  versions: ComponentVersion[];
}

interface VersionsData {
  [componentName: string]: ComponentVersions;
}

// Ensure versions file exists
function ensureVersionsFile() {
  const dir = path.dirname(VERSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(VERSIONS_FILE)) {
    fs.writeFileSync(VERSIONS_FILE, JSON.stringify({}, null, 2));
  }
}

// Read versions
function readVersions(): VersionsData {
  ensureVersionsFile();
  const data = fs.readFileSync(VERSIONS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write versions
function writeVersions(data: VersionsData) {
  ensureVersionsFile();
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(data, null, 2));
}

// GET - Get all versions for a component
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const component = searchParams.get('component');

    const versions = readVersions();

    if (component) {
      return NextResponse.json(versions[component] || { active: 'v1', versions: [] });
    }

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error('Error reading versions:', error);
    return NextResponse.json(
      { error: 'Failed to read versions' },
      { status: 500 }
    );
  }
}

// POST - Save new version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, note, code } = body;

    if (!component || !code) {
      return NextResponse.json(
        { error: 'Missing component or code' },
        { status: 400 }
      );
    }

    const versions = readVersions();
    const componentVersions = versions[component] || { active: 'v1', versions: [] };

    // Generate new version ID
    const existingIds = componentVersions.versions.map(v => parseInt(v.id.replace('v', '')));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const versionId = `v${nextId}`;

    // Create new version
    const newVersion: ComponentVersion = {
      id: versionId,
      timestamp: new Date().toISOString(),
      note: note || `Versione ${versionId}`,
      code,
    };

    // Add to versions list
    componentVersions.versions.push(newVersion);

    // Keep only last 5 versions
    if (componentVersions.versions.length > 5) {
      componentVersions.versions.shift(); // Remove oldest
    }

    // Set as active
    componentVersions.active = versionId;

    versions[component] = componentVersions;
    writeVersions(versions);

    return NextResponse.json({
      success: true,
      versionId,
      message: 'Version saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving version:', error);
    return NextResponse.json(
      { error: 'Failed to save version' },
      { status: 500 }
    );
  }
}

// PUT - Set active version
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, versionId } = body;

    if (!component || !versionId) {
      return NextResponse.json(
        { error: 'Missing component or versionId' },
        { status: 400 }
      );
    }

    const versions = readVersions();
    const componentVersions = versions[component];

    if (!componentVersions) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    const version = componentVersions.versions.find(v => v.id === versionId);
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    componentVersions.active = versionId;
    versions[component] = componentVersions;
    writeVersions(versions);

    return NextResponse.json({
      success: true,
      message: 'Active version updated',
    });
  } catch (error: any) {
    console.error('Error updating active version:', error);
    return NextResponse.json(
      { error: 'Failed to update active version' },
      { status: 500 }
    );
  }
}
