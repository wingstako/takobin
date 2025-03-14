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
import { FileText, ImageIcon, Lock, Code, File, Upload, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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

  const createPaste = api.paste.create.useMutation({
    onSuccess: (data) => {
      if (pasteType === "multimedia" && selectedFile) {
        // Now upload the file to the created paste
        uploadFileToServer(data.id, selectedFile);
      } else {
        router.push(`/pastes/${data.id}`);
      }
    },
  });

  // Separate function to upload file after paste creation
  const uploadFileToServer = async (pasteId: string, file: File) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pasteId", pasteId);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      toast.success("Paste and file created successfully");
      router.push(`/pastes/${pasteId}`);
    } catch (error) {
      toast.error("File upload failed");
      console.error("Error uploading file:", error);
      // Still navigate to paste even if file upload fails
      router.push(`/pastes/${pasteId}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) return;
    
    // For text pastes, require content
    if (pasteType === "text" && !content) return;
    
    // For multimedia pastes, require a file to be selected
    if (pasteType === "multimedia" && !selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsSubmitting(true);

    createPaste.mutate({
      title,
      content: pasteType === "text" ? content : `File upload paste: ${selectedFile?.name || "Unnamed file"}`,
      language: pasteType === "text" ? language : "plaintext",
      neverExpire,
      expiryDate: neverExpire ? undefined : expiryDate,
      password: isPasswordProtected ? password : undefined,
      visibility,
      pasteType: pasteType || undefined,
    });
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
                    <File className="h-3 w-3 mr-1" />
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
                    <File className="h-3 w-3 mr-1" />
                    Documents
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5">
                    <Upload className="h-3 w-3 mr-1" />
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
                  {!selectedFile ? (
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-2">Click to select a file</p>
                      <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
                      <input 
                        id="file-input" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/30 border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-md bg-primary/10 p-2">
                            <File className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium break-all">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleFileRemove();
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </Button>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">
                          File will be uploaded when you click "Create Paste"
                        </p>
                      </div>
                    </div>
                  )}
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
                (pasteType === "multimedia" && (!title || !selectedFile))
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