import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { fileUploads } from '@/server/db/schema';
import { nanoid } from 'nanoid';

interface UploadSaveRequest {
  url: string;
  filename: string;
  size: number;
  pasteId: string;
  mimeType: string;
}

export async function POST(request: Request) {
  // We're not using session but keeping the auth call for future authorization checks
  await auth();
  
  try {
    const requestData = await request.json() as UploadSaveRequest;
    const { url, filename, size, pasteId, mimeType } = requestData;
    
    if (!url || !filename || !pasteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract file type with type safety
    const fileTypePrefix: string = mimeType ? mimeType.split('/')[0] ?? 'unknown' : 'unknown';
    
    // Generate a unique ID for the file
    const fileId: string = nanoid(10);
    
    // Insert into database
    await db.insert(fileUploads).values({
      id: fileId,
      pasteId,
      filename,
      fileType: fileTypePrefix,
      fileSize: size ?? 0,
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