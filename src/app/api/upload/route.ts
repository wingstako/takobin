import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get the auth session
    const session = await auth();
    
    // Get query parameters from the URL
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename') || '';
    const pasteId = url.searchParams.get('pasteId') || '';
    const fileType = url.searchParams.get('fileType') || 'other';
    
    console.log(`Processing upload for ${filename}, pasteId: ${pasteId}, fileType: ${fileType}`);
    
    // Check for required parameters
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    // Handle file form data
    try {
      // Get the file from the form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file found in request' }, { status: 400 });
      }
      
      console.log(`Got file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Check file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File exceeds 5MB size limit' }, { status: 400 });
      }
      
      // Determine allowed content types
      let allowedContentTypes: string[] = [];
      switch (fileType) {
        case 'image':
          allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          break;
        case 'video':
          allowedContentTypes = ['video/mp4', 'video/webm', 'video/ogg'];
          break;
        case 'audio':
          allowedContentTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
          break;
        case 'document':
          allowedContentTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
            'text/html',
            'application/json'
          ];
          break;
        case 'archive':
          allowedContentTypes = [
            'application/zip', 
            'application/x-tar',
            'application/x-gzip'
          ];
          break;
        case 'code':
          allowedContentTypes = [
            'text/plain',
            'text/html',
            'application/javascript',
            'text/css'
          ];
          break;
        default:
          // Allow a wider range for "other" file types
          allowedContentTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'application/pdf', 'text/plain'
          ];
      }
      
      // Check if file type is allowed - more lenient check
      // Just a warning, we'll still proceed with the upload
      if (!allowedContentTypes.includes(file.type)) {
        console.warn(`File type ${file.type} is not in the recommended list for ${fileType}. Proceeding anyway.`);
      }
      
      // Upload the file to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        // Add any allowed properties according to Vercel Blob API
        addRandomSuffix: false, // Prevent random suffix on the filename
      });
      
      console.log('Upload successful:', blob);
      
      // Return the blob URL and metadata
      return NextResponse.json({
        url: blob.url,
        uploadedAt: new Date().toISOString(),
        filename: filename,
        pasteId: pasteId
      });
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fatal error in upload handler:', error);
    return NextResponse.json(
      { error: 'Server error processing upload' },
      { status: 500 }
    );
  }
} 