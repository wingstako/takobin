import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const session = await auth();
  
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        clientPayload
      ) => {
        // Parse the client payload for additional info
        const { pasteId, fileType } = clientPayload ? JSON.parse(clientPayload as string) : {};

        // Check file size limit (5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
        if (body.size > MAX_SIZE) {
          throw new Error('File size exceeds the 5MB limit');
        }

        // Define allowed content types based on the file type
        let allowedContentTypes: string[] = [];
        
        if (fileType === 'image') {
          allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        } else if (fileType === 'video') {
          allowedContentTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        } else if (fileType === 'document') {
          allowedContentTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv'
          ];
        } else {
          // Default to a restrictive set for general uploads
          allowedContentTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain'
          ];
        }

        return {
          allowedContentTypes,
          tokenPayload: JSON.stringify({
            userId: session?.user?.id,
            pasteId
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log('blob upload completed', blob, tokenPayload);
          
          // You would typically update your database here
          // This is called by Vercel Blob after the upload completes
          const { userId, pasteId } = tokenPayload ? JSON.parse(tokenPayload) : {};
          
          // In production, you would update your database with the blob URL
          // and associate it with the paste
          
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
} 