import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; filename: string } }
) {
  try {
    const { category, filename } = params;

    // SECURITY: Validazione contro path traversal
    if (category.includes('..') || category.includes('/') || category.includes('\\')) {
      return NextResponse.json(
        { error: 'Categoria non valida' },
        { status: 400 }
      );
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nome file non valido' },
        { status: 400 }
      );
    }

    // Validazione categoria contro whitelist
    const allowedCategories = ['cataloghi', 'schede-tecniche', 'certificazioni', 'documentazione'];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categoria non valida' },
        { status: 400 }
      );
    }

    // Validazione estensione file
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExtension = allowedExtensions.some(ext => filename.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Formato file non supportato' },
        { status: 400 }
      );
    }

    // Validazione lunghezza filename (max 100 caratteri)
    if (filename.length > 100) {
      return NextResponse.json(
        { error: 'Nome file troppo lungo' },
        { status: 400 }
      );
    }

    // Percorso file - la cartella risorse_download è al livello superiore rispetto a frontend
    const filePath = join(process.cwd(), '..', 'risorse_download', category, filename);

    // Verifica esistenza file
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File non trovato. Il file verrà aggiunto a breve.' },
        { status: 404 }
      );
    }

    // Leggi il file
    const fileBuffer = await readFile(filePath);

    // Restituisci il file con gli header appropriati
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Errore nel download del file:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
