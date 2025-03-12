"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { use } from "react";

export default function FilesPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const { data: paste, isLoading: isPasteLoading } = api.paste.getById.useQuery({ id });
  const { data: files, isLoading: isFilesLoading, refetch } = api.fileUpload.getByPasteId.useQuery({ pasteId: id });

  const handleFileUpload = () => {
    toast.info("File upload feature coming soon", {
      description: "This feature is currently under development.",
    });
  };

  if (isPasteLoading || isFilesLoading) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading paste and file information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Paste Not Found</CardTitle>
            <CardDescription>The paste you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The paste may have been deleted or may never have existed.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Files for {paste.title}</CardTitle>
              <CardDescription>
                Upload and manage files associated with this paste
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12">
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">File Upload Coming Soon</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              This feature is currently under development. Check back soon!
            </p>
            <Button onClick={handleFileUpload}>Upload Files</Button>
          </div>

          {files && files.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-medium">Uploaded Files</h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)} · {file.fileType}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/pastes/${id}`)}>
            Back to Paste
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
} 