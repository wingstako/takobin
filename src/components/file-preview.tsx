import Image from 'next/image';
import { useState } from 'react';
import { 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';

interface FileUpload {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  createdAt: string;
}

interface FilePreviewProps {
  file: FileUpload;
}

export function FilePreview({ file }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const handleDownload = () => {
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
  
  if (file.fileType === 'image') {
    return (
      <div className="relative w-full max-h-[500px] flex items-center justify-center border rounded-md p-4 bg-muted/20">
        {!imageError ? (
          <Image
            src={file.storageKey}
            alt={file.filename}
            className="max-w-full max-h-[500px] object-contain"
            width={800}
            height={600}
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <img
            src={file.storageKey}
            alt={file.filename}
            className="max-w-full max-h-[500px] object-contain"
          />
        )}
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm flex items-center space-x-2">
          <span className="text-xs">{formatBytes(file.fileSize)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  } else if (file.fileType === 'video') {
    return (
      <div className="relative w-full max-h-[500px] border rounded-md overflow-hidden">
        <video 
          controls 
          className="max-w-full w-full"
          src={file.storageKey}
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  } else if (file.fileType === 'document' && 
             (file.filename.endsWith('.pdf') || file.storageKey.endsWith('.pdf'))) {
    return (
      <div className="w-full border rounded-md overflow-hidden h-[500px] relative">
        <iframe 
          src={file.storageKey} 
          className="w-full h-full"
          title={file.filename}
        />
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm flex items-center space-x-2">
          <span className="text-xs">{formatBytes(file.fileSize)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 border rounded-md">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          {getFileIcon(file.fileType)}
        </div>
        <p className="text-lg font-medium">{file.filename}</p>
        <p className="text-sm text-muted-foreground">{formatBytes(file.fileSize)}</p>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    );
  }
} 