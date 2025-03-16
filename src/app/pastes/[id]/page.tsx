"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { 
  Clipboard, 
  Share2, 
  Paperclip, 
  Image, 
  Lock, 
  Globe, 
  Edit, 
  FileText, 
  Code, 
  Image as ImageIcon, 
  Video, 
  Download 
} from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/code-block";
import { useSession } from "next-auth/react";
import { FilePreview } from "@/components/file-preview";

export default function PastePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordToVerify, setPasswordToVerify] = useState("");
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string>("content");

  const { data: paste, refetch, isLoading, error } = api.paste.getById.useQuery({ id, password: passwordToVerify });
  
  const { data: files, isLoading: isLoadingFiles } = api.fileUpload.getByPasteId.useQuery(
    { pasteId: id },
    { 
      enabled: !!id && (!paste?.isProtected || !!passwordToVerify)
    }
  );

  const hasFiles = !isLoadingFiles && files && files.length > 0;
  const isMultimediaPaste = paste?.pasteType === "multimedia";

  // Update active tab when files are loaded
  useEffect(() => {
    if (isMultimediaPaste && hasFiles) {
      setActiveTab("file");
    }
  }, [isMultimediaPaste, hasFiles]);

  // Check if user has access to this paste
  const canAccessPaste = () => {
    if (!paste) return false;
    
    // Public pastes are accessible to everyone
    if (paste.visibility === "public") return true;
    
    // Private pastes are only accessible to their owners
    if (paste.visibility === "private") {
      // If the user is not authenticated, they can't access private pastes
      if (status !== "authenticated") return false;
      
      // If the user is authenticated, check if they are the owner
      return session?.user?.id === paste.userId;
    }
    
    return false;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPasswordToVerify(password);
    await refetch();
    setIsSubmitting(false);
  };

  const copyToClipboard = () => {
    if (paste?.content) {
      navigator.clipboard.writeText(paste.content).then(() => {
        toast.success("Copied to clipboard", {
          description: "The paste content has been copied to your clipboard.",
        });
      }).catch(() => {
        toast.error("Failed to copy to clipboard");
      });
    }
  };

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("URL copied to clipboard", {
        description: "Share this URL with others to view this paste.",
      });
    }).catch(() => {
      toast.error("Failed to copy URL to clipboard");
    });
  };
  
  const exportToCarbon = () => {
    if (paste?.content) {
      // Double URL encode the content
      const encodedContent = encodeURIComponent(encodeURIComponent(paste.content));
      const language = paste.language ?? "auto";
      const carbonUrl = `https://carbon.now.sh/?l=${language}&code=${encodedContent}`;
      window.open(carbonUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
        <Card className="mx-auto max-w-4xl w-full shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
        <Card className="mx-auto max-w-4xl w-full shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error.message === "FORBIDDEN" ? "This paste has expired." : "Failed to load paste."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-muted-foreground">
              {error.message === "FORBIDDEN"
                ? "The paste you're trying to access has expired and is no longer available."
                : "There was an error loading this paste. It may have been deleted or may not exist."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center px-4 sm:px-6">
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If paste is password protected and content is not available
  if (paste?.isProtected && !paste.content) {
    return (
      <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
        <Card className="mx-auto max-w-4xl w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle>{paste.title}</CardTitle>
            <CardDescription>This paste is password protected</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="max-w-md mx-auto px-4 sm:px-6">
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Enter the password to view this paste.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center px-4 sm:px-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Submit"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
        <Card className="mx-auto max-w-4xl w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle>Paste Not Found</CardTitle>
            <CardDescription>The paste you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-muted-foreground text-center">
              The paste may have been deleted or may never have existed.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center px-4 sm:px-6">
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // After loading checks, add visibility check
  if (!isLoading && paste && !canAccessPaste()) {
    return (
      <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
        <Card className="mx-auto max-w-4xl w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this paste.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-muted-foreground text-center">
              This paste is private and can only be accessed by its owner.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center px-4 sm:px-6">
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-[1920px] mx-auto flex justify-center py-8 px-4 sm:px-6">
      <Card className="mx-auto max-w-4xl w-full shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{paste.title}</CardTitle>
                {paste.isProtected && (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" /> Password Protected
                  </span>
                )}
                {paste.visibility && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${paste.visibility === 'private' ? 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800' : 'text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800'}`}>
                    {paste.visibility === 'private' ? (
                      <Lock className="mr-1 h-3 w-3" />
                    ) : (
                      <Globe className="mr-1 h-3 w-3" />
                    )}
                    {paste.visibility === 'private' ? 'Private' : 'Public'}
                  </span>
                )}
                {isMultimediaPaste ? (
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-500 dark:bg-blue-950 dark:border-blue-800">
                    <Paperclip className="mr-1 h-3 w-3" /> File Upload
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-500 dark:bg-amber-950 dark:border-amber-800">
                    <Code className="mr-1 h-3 w-3" /> Text Paste
                  </span>
                )}
              </div>
              <CardDescription>
                Created {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                {paste.expiresAt && (
                  <> · Expires {formatDistanceToNow(new Date(paste.expiresAt), { addSuffix: true })}</>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {paste.pasteType === "text" && (
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy content">
                  <Clipboard className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={shareUrl} title="Share URL">
                <Share2 className="h-4 w-4" />
              </Button>
              {paste.pasteType === "text" && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={exportToCarbon}
                    title="Export as image (Carbon)"
                >
                  <Image className="h-4 w-4" />
                </Button>
              )}
              {paste.pasteType === "text" && paste.userId === session?.user?.id && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => router.push(`/pastes/${id}/edit`)}
                  title="Edit paste"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {hasFiles ? (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="content">
                  {isMultimediaPaste ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Description
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Content
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger value="file">
                  <Paperclip className="h-4 w-4 mr-2" />
                  File {files && files.length > 1 && `(${files.length})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-0">
                <div className="rounded-md border">
                  <CodeBlock code={paste.content ?? ""} language={paste.language ?? "plaintext"} />
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="mt-0">
                {files && files.length > 0 && (
                  <div className="space-y-4">
                    {files.length === 1 && files[0] ? (
                      <FilePreview 
                        file={{
                          id: files[0].id || "",
                          filename: files[0].filename || "",
                          fileType: files[0].fileType || "",
                          fileSize: files[0].fileSize || 0,
                          storageKey: files[0].storageKey || "",
                          createdAt: files[0].createdAt.toString(),
                        }} 
                      />
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Attached Files ({files.length})</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {files.map((file) => (
                            <div key={file.id} className="border rounded-md p-4 flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                {file.fileType === 'image' ? (
                                  <ImageIcon className="h-5 w-5" />
                                ) : file.fileType === 'video' ? (
                                  <Video className="h-5 w-5" />
                                ) : file.fileType === 'document' ? (
                                  <FileText className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Create temporary link and trigger download
                                  const link = document.createElement('a');
                                  link.href = file.storageKey;
                                  link.download = file.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="rounded-md border">
              <CodeBlock code={paste.content ?? ""} language={paste.language ?? "plaintext"} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
