"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/date-picker";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { add } from "date-fns";
import { FileUploadDropzone } from "@/components/file-upload-dropzone";
import { UploadedFilesList } from "@/components/uploaded-files-list";
import { FileText, ImageIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell/Bash" },
];

export default function EditPastePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiryDate, setExpiryDate] = useState<Date>(add(new Date(), { days: 7 }));
  const [neverExpire, setNeverExpire] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
  }>>([]);
  const [pasteType, setPasteType] = useState<"text" | "multimedia">("text");

  const { data: paste, isLoading, error } = api.paste.getById.useQuery({ id });
  const { data: files, isLoading: isLoadingFiles } = api.fileUpload.getByPasteId.useQuery(
    { pasteId: id },
    { enabled: !!id }
  );

  const updatePaste = api.paste.update.useMutation({
    onSuccess: () => {
      toast.success("Paste updated successfully");
      router.push(`/pastes/${id}`);
    },
    onError: (error) => {
      toast.error("Failed to update paste", {
        description: error.message,
      });
    },
  });

  const deleteFile = api.fileUpload.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete file", {
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (paste && !isLoading) {
      setTitle(paste.title);
      setContent(paste.content ?? "");
      setLanguage(paste.language ?? "plaintext");
      setIsPasswordProtected(paste.isProtected ?? false);
      setVisibility(paste.visibility as "public" | "private" || "public");

      // Handle expiry date
      if (paste.expiresAt === null) {
        setNeverExpire(true);
      } else if (paste.expiresAt) {
        setExpiryDate(new Date(paste.expiresAt));
        setNeverExpire(false);
      }
      
      // Set the paste type from database, this cannot be changed
      if (paste.pasteType) {
        setPasteType(paste.pasteType as "text" | "multimedia");
      } else if (files && files.length > 0) {
        setPasteType("multimedia");
      } else {
        setPasteType("text");
      }
    }
  }, [paste, isLoading, files]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      return;
    }
    
    // For text pastes, require content
    if (pasteType === "text" && !content) {
      return;
    }

    // Ensure we use the original paste type from the database
    const originalPasteType = paste?.pasteType as "text" | "multimedia";

    updatePaste.mutate({
      id,
      title,
      content: pasteType === "text" ? content : "File upload paste",
      language: pasteType === "text" ? language : "plaintext",
      neverExpire,
      expiryDate: neverExpire ? undefined : expiryDate,
      password: isPasswordProtected && password ? password : undefined,
      removePassword: removePassword,
      visibility,
      pasteType: originalPasteType, // Always use the original paste type
    });
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFile.mutate({ id: fileId });
    // Optimistically remove from UI
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleFileUploadComplete = (file: { 
    id: string; 
    url: string; 
    filename: string; 
    fileType: string; 
    fileSize: number 
  }) => {
    setUploadedFiles((prev) => [...prev, {
      ...file,
      createdAt: new Date().toISOString()
    }]);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error?.message ?? "Failed to load paste"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The paste you're trying to edit may not exist or you don't have permission to edit it.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/pastes")}>Back to My Pastes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <main className="container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-center">
            {pasteType === "text" ? (
              <FileText className="h-5 w-5 mr-2 text-primary" />
            ) : (
              <ImageIcon className="h-5 w-5 mr-2 text-primary" />
            )}
            <CardTitle>
              Edit {pasteType === "text" ? "Text Paste" : "File Upload"}
            </CardTitle>
          </div>
          <CardDescription>
            Update your paste content and settings
          </CardDescription>
          <div className="flex mt-2">
            <Badge 
              variant={pasteType === "text" ? "default" : "outline"}
              className="mr-2"
            >
              <FileText className="h-3 w-3 mr-1" />
              {pasteType === "text" ? "Text Paste" : "File Upload"} 
            </Badge>
            <Badge 
              variant="outline"
              className="opacity-70"
            >
              <Lock className="h-3 w-3 mr-1" />
              Paste type cannot be changed
            </Badge>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter paste title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            {pasteType === "text" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your paste content here"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Syntax Highlighting</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="files">Files</Label>
                  <FileUploadDropzone 
                    pasteId={id} 
                    onUploadComplete={handleFileUploadComplete}
                    multiple
                  />
                </div>
                
                {isLoadingFiles ? (
                  <div className="space-y-2">
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <UploadedFilesList 
                    files={(files ?? []).map(file => ({
                      ...file,
                      createdAt: file.createdAt.toString(),
                    }))}
                    newFiles={uploadedFiles}
                    pasteOwnerId={paste?.userId}
                    onDeleteFile={handleDeleteFile}
                  />
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={(value: "public" | "private") => setVisibility(value)}>
                  <SelectTrigger id="visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem 
                      value="private" 
                      disabled={status !== "authenticated"}
                    >
                      Private {status !== "authenticated" && "(login required)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <div className="flex items-center space-x-2">
                  <DatePicker 
                    date={expiryDate} 
                    onDateChange={(date) => date && setExpiryDate(date)} 
                    disabled={neverExpire}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2 ml-2">
                    <Checkbox
                      id="never-expire"
                      checked={neverExpire}
                      onCheckedChange={(checked) => setNeverExpire(!!checked)}
                      disabled={status !== "authenticated"}
                    />
                    <Label htmlFor="never-expire" className={status !== "authenticated" ? "text-muted-foreground cursor-not-allowed whitespace-nowrap" : "whitespace-nowrap"}>
                      Never expire {status !== "authenticated" && "(login required)"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {paste.isProtected ? (
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="password"
                      type="password"
                      placeholder={isPasswordProtected ? "Enter a new password" : "Keep existing password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!isPasswordProtected}
                      className="flex-1"
                    />
                    <div className="flex items-center space-x-2 ml-2">
                      <Checkbox
                        id="password-protected"
                        checked={isPasswordProtected}
                        onCheckedChange={(checked) => {
                          setIsPasswordProtected(!!checked);
                          if (!checked) setPassword("");
                        }}
                      />
                      <Label htmlFor="password-protected" className="whitespace-nowrap">
                        Change password
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remove-password"
                      checked={removePassword}
                      onCheckedChange={(checked) => {
                        setRemovePassword(!!checked);
                        if (checked) {
                          setIsPasswordProtected(false);
                          setPassword("");
                        }
                      }}
                    />
                    <Label htmlFor="remove-password">Remove password protection</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="password"
                      type="password"
                      placeholder={isPasswordProtected ? "Enter password" : "Password disabled"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!isPasswordProtected}
                      className="flex-1"
                    />
                    <div className="flex items-center space-x-2 ml-2">
                      <Checkbox
                        id="password-protected"
                        checked={isPasswordProtected}
                        onCheckedChange={(checked) => setIsPasswordProtected(!!checked)}
                      />
                      <Label htmlFor="password-protected" className="whitespace-nowrap">
                        Password protect
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePaste.isPending || (pasteType === "text" && !content)}>
              {updatePaste.isPending ? "Updating..." : "Update Paste"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}