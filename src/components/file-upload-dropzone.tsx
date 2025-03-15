import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { upload } from '@vercel/blob/client';
import { Cloud, File, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

type FileUploadDropzoneProps = {
  pasteId: string;
  onUploadComplete?: (file: { id: string; url: string; filename: string; fileType: string; fileSize: number }) => void;
  multiple?: boolean;
  disabled?: boolean;
};

// Create a proper type for the upload options including onProgress
type CustomUploadOptions = {
  access: 'public'; // Only allow 'public' as per the API requirements
  handleUploadUrl: string;
  clientPayload?: string;
  onProgress?: (progress: number) => void;
};

export function FileUploadDropzone({
  pasteId,
  onUploadComplete,
  multiple = false,
  disabled = false,
}: FileUploadDropzoneProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, File>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;
      
      // If too many files at once, notify user
      if (acceptedFiles.length > 10) {
        toast.warning(`Maximum 10 files can be uploaded at once. Only the first 10 files will be processed.`);
        acceptedFiles = acceptedFiles.slice(0, 10);
      }
      
      const newUploadingFiles: Record<string, File> = {};
      
      // Initialize progress for each file
      acceptedFiles.forEach((file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} exceeds the 5MB limit`);
          return;
        }
        
        const fileId = Math.random().toString(36).substring(2, 15);
        newUploadingFiles[fileId] = file;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
      });
      
      // If no valid files to upload, exit early
      if (Object.keys(newUploadingFiles).length === 0) {
        return;
      }
      
      setUploadingFiles((prev) => ({ ...prev, ...newUploadingFiles }));
      
      // Toast notification for starting upload
      if (Object.keys(newUploadingFiles).length > 0) {
        toast.info(
          `Starting upload of ${Object.keys(newUploadingFiles).length} ${
            Object.keys(newUploadingFiles).length === 1 ? "file" : "files"
          }`
        );
      }
      
      // Upload each file
      for (const [fileId, file] of Object.entries(newUploadingFiles)) {
        // Define progressInterval at this scope so it's available in the catch block
        let progressInterval: NodeJS.Timeout | null = null;
        
        try {
          // Determine file type category (more comprehensive detection)
          let fileType = 'other';
          const mimeType = file.type.toLowerCase();
          
          if (mimeType.startsWith('image/')) {
            fileType = 'image';
          } else if (mimeType.startsWith('video/')) {
            fileType = 'video';
          } else if (mimeType.startsWith('audio/')) {
            fileType = 'audio';
          } else if (
            mimeType === 'application/pdf' ||
            mimeType.includes('word') ||
            mimeType.includes('document') ||
            mimeType.includes('spreadsheet') ||
            mimeType.includes('presentation') ||
            mimeType === 'text/plain' ||
            mimeType === 'text/csv' ||
            mimeType === 'text/html' ||
            mimeType === 'application/json'
          ) {
            fileType = 'document';
          } else if (
            mimeType.includes('zip') ||
            mimeType.includes('compressed') ||
            mimeType.includes('archive') ||
            mimeType === 'application/x-tar' ||
            mimeType === 'application/x-gzip'
          ) {
            fileType = 'archive';
          } else if (
            mimeType.includes('code') ||
            file.name.endsWith('.js') ||
            file.name.endsWith('.ts') ||
            file.name.endsWith('.jsx') ||
            file.name.endsWith('.tsx') ||
            file.name.endsWith('.html') ||
            file.name.endsWith('.css') ||
            file.name.endsWith('.scss') ||
            file.name.endsWith('.py') ||
            file.name.endsWith('.java') ||
            file.name.endsWith('.php') ||
            file.name.endsWith('.rb') ||
            file.name.endsWith('.go')
          ) {
            fileType = 'code';
          }
          
          // Create a simpler JSON payload that's unlikely to cause parsing issues
          const clientPayloadStr = JSON.stringify({
            pasteId: pasteId,
            fileType: fileType
          });
          
          console.log("Starting upload for file:", file.name);
          console.log("Client payload:", clientPayloadStr);
          
          // Create FormData to properly handle the multipart upload
          const formData = new FormData();
          formData.append('file', file);
          
          // Simulate upload progress since we're not using Vercel's progress tracking
          progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const currentProgress = prev[fileId] || 0;
              // Cap progress at 90% until we get the actual response
              const newProgress = Math.min(90, currentProgress + Math.floor(Math.random() * 10));
              return { ...prev, [fileId]: newProgress };
            });
          }, 300);
          
          // Use raw fetch for better control over the upload
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&pasteId=${encodeURIComponent(pasteId)}&fileType=${encodeURIComponent(fileType)}`, {
            method: 'POST',
            body: formData
          });
          
          // Clear the progress simulation
          clearInterval(progressInterval);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }
          
          // Set progress to 100% when complete
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
          
          const blobData = await response.json();
          console.log("Upload succeeded:", blobData);
          
          // Now save the file data to our database
          const saveResponse = await fetch('/api/upload/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: blobData.url,
              filename: file.name,
              size: file.size,
              pasteId,
              mimeType: file.type,
            }),
          });
          
          const data = await saveResponse.json();
          
          if (!saveResponse.ok) {
            throw new Error(data.error || 'Failed to save file information');
          }
          
          if (onUploadComplete) {
            onUploadComplete({
              id: data.fileId,
              url: blobData.url,
              filename: file.name,
              fileType: fileType,
              fileSize: file.size,
            });
          }
          
          toast.success(`File ${file.name} uploaded successfully`);
          
          // Remove file from uploading state
          setUploadingFiles((prev) => {
            const newState = { ...prev };
            delete newState[fileId];
            return newState;
          });
          
        } catch (error) {
          // Make sure to clear the interval if there's an error
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}: ${(error as Error).message}`);
          
          // Remove file from uploading state but keep progress for feedback
          setUploadingFiles((prev) => {
            const newState = { ...prev };
            delete newState[fileId];
            return newState;
          });
        }
      }
    },
    [pasteId, onUploadComplete, disabled]
  );
  
  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles((prev) => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
    
    setUploadProgress((prev) => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled,
    onDragEnter: () => setIsDraggingOver(true),
    onDragLeave: () => setIsDraggingOver(false),
    onDropAccepted: () => setIsDraggingOver(false),
    onDropRejected: () => setIsDraggingOver(false),
  });
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg p-6 
          ${isDragActive || isDraggingOver 
            ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02]' 
            : 'border-muted-foreground/25'} 
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'} 
          transition-all duration-200 ease-in-out
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {isDragActive ? (
            <>
              <Upload className="h-10 w-10 text-primary animate-pulse" />
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-primary animate-pulse">
                  Drop to upload files
                </p>
                <p className="text-xs text-muted-foreground">
                  Files will be ready to share instantly
                </p>
              </div>
            </>
          ) : (
            <>
              <Cloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  Drag & drop files here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse (max 5MB {multiple ? "per file" : ""})
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Uploading Files Display */}
      {Object.keys(uploadingFiles).length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium flex items-center">
            <Upload className="h-4 w-4 mr-2 text-primary animate-pulse" />
            Uploading {Object.keys(uploadingFiles).length} {Object.keys(uploadingFiles).length === 1 ? "file" : "files"}
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {Object.entries(uploadingFiles).map(([fileId, file]) => (
              <div key={fileId} className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                <File className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs truncate font-medium">{file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Progress value={uploadProgress[fileId] ?? 0} className="h-1 mt-1" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => removeUploadingFile(fileId)}
                  aria-label="Cancel upload"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 