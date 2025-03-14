import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { fileUploads } from '@/server/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  const session = await auth();
  
  try {
    const { url, filename, size, pasteId, mimeType } = await request.json();
    
    if (!url || !filename || !pasteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract file type
    const fileType = mimeType?.split('/')[0] || 'unknown';
    
    // Generate a unique ID for the file
    const fileId = nanoid(10);
    
    // Insert into database
    await db.insert(fileUploads).values({
      id: fileId,
      pasteId,
      filename,
      fileType,
      fileSize: size || 0,
      storageKey: url,
      createdAt: new Date(),
    });
    
    return NextResponse.json({ 
      success: true, 
      fileId 
    });
    
  } catch (error) {
    console.error('Error saving file data:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 