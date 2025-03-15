"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/date-picker";
import { api } from "@/trpc/react";
import { add } from "date-fns";
import { FileUploadDropzone } from "@/components/file-upload-dropzone";
import { UploadedFilesList } from "@/components/uploaded-files-list";
import { Badge } from "@/components/ui/badge";
import { FileText, ImageIcon, Lock, Code, File as FileIcon, Upload as UploadIcon, Clock, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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

// Different paste types
type PasteType = "text" | "multimedia";

export default function NewPastePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiryDate, setExpiryDate] = useState<Date>(add(new Date(), { days: 7 }));
  const [neverExpire, setNeverExpire] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [pasteType, setPasteType] = useState<PasteType | null>(null);
  // Store selected file info but don't upload yet
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState(""); // Added description state for multimedia pastes
  
  // For file upload state tracking
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ url: string; filename: string; size: number; fileType: string } | null>(null);

  const createPaste = api.paste.create.useMutation({
    onSuccess: (data) => {
      // For text pastes, just redirect to the paste
      if (pasteType === "text") {
        toast.success("Paste created successfully");
      router.push(`/pastes/${data.id}`);
        return;
      }
      
      // For multimedia pastes with pre-uploaded files, update the database
      if (pasteType === "multimedia" && uploadedFileInfo) {
        // Save the uploaded file info to the database
        saveFileInfo(data.id, uploadedFileInfo);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create paste: ${error.message}`);
      setIsSubmitting(false);
    }
  });
  
  // Save file information to the database after paste creation
  const saveFileInfo = async (pasteId: string, fileInfo: { url: string; filename: string; size: number; fileType: string }) => {
    try {
      const response = await fetch('/api/upload/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileInfo.url,
          filename: fileInfo.filename,
          size: fileInfo.size,
          pasteId,
          mimeType: fileInfo.fileType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file information');
      }
      
      toast.success("Paste and file created successfully");
      router.push(`/pastes/${pasteId}`);
    } catch (error) {
      toast.error(`Error saving file information: ${(error as Error).message}`);
      // Still redirect to the paste, even if we couldn't save the file info
      router.push(`/pastes/${pasteId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload file first before creating paste for multimedia pastes
  const uploadFile = async (file: File): Promise<{ url: string; filename: string; size: number; fileType: string }> => {
    setIsUploadingFile(true);
    setUploadError(null);
    
    try {
      // Determine file type
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
        mimeType === 'text/plain'
      ) {
        fileType = 'document';
      }
      
      const formData = new FormData();
      formData.append("file", file);
      
      // Generate a temp ID for this upload
      const tempId = `temp-${Math.random().toString(36).substring(2, 10)}`;
      
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&pasteId=${tempId}&fileType=${fileType}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "File upload failed");
      }
      
      const data = await response.json();
      return {
        url: data.url,
        filename: file.name,
        size: file.size,
        fileType: file.type
      };
    } catch (error) {
      setUploadError((error as Error).message);
      throw error;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    // For text pastes, require content
    if (pasteType === "text" && !content) {
      toast.error("Please enter some content");
      return;
    }

    // For multimedia pastes, require a file to be selected
    if (pasteType === "multimedia" && !selectedFile) {
      toast.error("Please select a file");
      return;
    }

    // For multimedia pastes, validate description field
    if (pasteType === "multimedia" && !description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For multimedia pastes, upload the file first
      if (pasteType === "multimedia" && selectedFile) {
        try {
          const fileInfo = await uploadFile(selectedFile);
          setUploadedFileInfo(fileInfo);
          
          // Now create the paste with the uploaded file info
          createPaste.mutate({
            title,
            content: description,
            language: "plaintext",
            neverExpire,
            expiryDate: neverExpire ? undefined : expiryDate,
            password: isPasswordProtected ? password : undefined,
            visibility,
            pasteType: "multimedia",
          });
        } catch (error) {
          toast.error(`Failed to upload file: ${(error as Error).message}`);
          setIsSubmitting(false);
          return; // Don't create paste if file upload fails
        }
      } else {
        // For text pastes, just create the paste
    createPaste.mutate({
      title,
      content,
      language,
      neverExpire,
      expiryDate: neverExpire ? undefined : expiryDate,
      password: isPasswordProtected ? password : undefined,
      visibility,
          pasteType: "text",
        });
      }
    } catch (error) {
      toast.error(`An error occurred: ${(error as Error).message}`);
      setIsSubmitting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  // Handle file removal
  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  // If user hasn't selected a paste type yet, show selection screen
  if (!pasteType) {
    return (
      <div className="px-4 md:px-6 py-8 w-full flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create New Paste</h1>
            <p className="text-muted-foreground mt-2">Choose the type of content you want to share</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-all" 
              onClick={() => setPasteType("text")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mb-2">Text Paste</CardTitle>
                <CardDescription>
                  Share code snippets, notes, or any text with syntax highlighting
                </CardDescription>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="bg-primary/5">
                    <Code className="h-3 w-3 mr-1" />
                    Code
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5">
                    <FileIcon className="h-3 w-3 mr-1" />
                    Snippets
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5">
                    <FileText className="h-3 w-3 mr-1" />
                    Text
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:border-primary transition-all" 
              onClick={() => setPasteType("multimedia")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mb-2">File Upload</CardTitle>
                <CardDescription>
                  Share images, videos, documents and other files
                </CardDescription>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="bg-primary/5">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Images
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5">
                    <FileIcon className="h-3 w-3 mr-1" />
                    Documents
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5">
                    <UploadIcon className="h-3 w-3 mr-1" />
                    Files
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="px-4 md:px-6 py-8 w-full flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="relative pb-0">
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute left-4 top-4 h-16 w-16" 
            onClick={() => {
              setPasteType(null);
              setSelectedFile(null);
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            <span className="sr-only">Back to paste type selection</span>
          </Button>
          
          <div className="ml-14 px-4">
            <div className="flex items-center">
              {pasteType === "text" ? (
                <FileText className="h-5 w-5 mr-2 text-primary" />
              ) : (
                <ImageIcon className="h-5 w-5 mr-2 text-primary" />
              )}
              <CardTitle>
                {pasteType === "text" ? "Create Text Paste" : "Upload File"}
              </CardTitle>
            </div>
          <CardDescription>
              {pasteType === "text" 
                ? "Share code snippets, notes, or any text with syntax highlighting" 
                : "Share a single file (image, document, or other file)"
              }
          </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
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
                  <Select 
                    value={language} 
                    onValueChange={setLanguage}
                  >
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
              <div className="space-y-2">
                <Label htmlFor="files">File</Label>
                
                <div className="space-y-4">
                  {selectedFile ? (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleFileRemove}
                          disabled={isSubmitting || isUploadingFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Show upload error if any */}
                      {uploadError && (
                        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                          <p>Error: {uploadError}</p>
                        </div>
                      )}
                      
                      {/* Show upload progress */}
                      {isUploadingFile && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Uploading...</p>
                          <Progress value={40} className="h-1" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => document.getElementById('file-input')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                        
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          
                          // Check file size
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File exceeds the 5MB limit");
                            return;
                          }
                          
                          handleFileSelect(file);
                        }
                      }}
                    >
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        disabled={isSubmitting}
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Upload a file</p>
                          <p className="text-xs text-muted-foreground">
                            Click to browse or drag and drop (max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add description field for multimedia pastes */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a description for this file"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select 
                  value={visibility} 
                  onValueChange={(value: "public" | "private") => setVisibility(value)}
                >
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
                  <Label 
                    htmlFor="password-protected" 
                    className="whitespace-nowrap"
                  >
                    Password protect
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                createPaste.isPending || 
                (pasteType === "text" && (!title || !content)) ||
                (pasteType === "multimedia" && (!title || !selectedFile || !description.trim()))
              }
            >
              {createPaste.isPending || isSubmitting
                ? "Processing..." 
                : "Create Paste"
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
} 