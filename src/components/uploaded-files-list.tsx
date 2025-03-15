import { useState } from 'react';
import Image from 'next/image';
import { 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Trash2, 
  Download, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { formatBytes } from '@/lib/utils';

interface FileUpload {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  createdAt: string;
}

// Add a new interface for newly uploaded files
interface NewFileUpload {
  id: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
}

interface UploadedFilesListProps {
  files: FileUpload[];
  newFiles?: NewFileUpload[];
  pasteOwnerId?: string | null;
  onDeleteFile?: (fileId: string) => void;
}

export function UploadedFilesList({ 
  files, 
  newFiles = [],
  pasteOwnerId,
  onDeleteFile 
}: UploadedFilesListProps) {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  
  const canDelete = session?.user?.id === pasteOwnerId && typeof onDeleteFile === 'function';
  
  const handleDownload = (file: FileUpload) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = file.storageKey;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };
  
  const renderFilePreview = (file: FileUpload) => {
    if (file.fileType === 'image') {
      return (
        <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
          <Image
            src={file.storageKey}
            alt={file.filename}
            className="max-w-full max-h-full object-contain"
            width={800}
            height={600}
          />
        </div>
      );
    } else if (file.fileType === 'video') {
      return (
        <video 
          controls 
          className="max-w-full max-h-[70vh]"
          src={file.storageKey}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (file.fileType === 'document' && 
               (file.filename.endsWith('.pdf') || file.storageKey.endsWith('.pdf'))) {
      return (
        <iframe 
          src={file.storageKey} 
          className="w-full h-[70vh]"
          title={file.filename}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          {getFileIcon(file.fileType)}
          <p className="text-lg font-medium">{file.filename}</p>
          <p className="text-sm text-muted-foreground">{formatBytes(file.fileSize)}</p>
          <Button onClick={() => handleDownload(file)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      );
    }
  };

  // Combine both file types for rendering
  const allFiles = [
    ...files,
    ...newFiles.map(file => ({
      id: file.id,
      filename: file.filename,
      fileType: file.fileType,
      fileSize: file.fileSize,
      storageKey: file.url,
      createdAt: new Date().toISOString()
    }))
  ];

  if (!allFiles.length) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Attached Files ({allFiles.length})</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {allFiles.map((file) => (
          <div
            key={file.id}
            className="group relative flex flex-col border rounded-md overflow-hidden hover:border-primary transition-colors"
          >
            {/* File Preview/Thumbnail */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedFile(file)}
                  className="flex flex-col items-center justify-center p-4 h-32 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  {file.fileType === 'image' ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={file.storageKey}
                        alt={file.filename}
                        className="object-cover"
                        fill
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                      {getFileIcon(file.fileType)}
                      <span className="text-xs text-center truncate max-w-full px-1">
                        {file.filename}
                      </span>
                    </div>
                  )}
                </button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl w-full">
                <DialogHeader>
                  <DialogTitle className="truncate">{file.filename}</DialogTitle>
                </DialogHeader>
                {renderFilePreview(file)}
              </DialogContent>
            </Dialog>
            
            {/* File Actions */}
            <div className="flex items-center justify-between p-2 bg-background text-xs">
              <span className="truncate flex-1">{formatBytes(file.fileSize)}</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => onDeleteFile(file.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 