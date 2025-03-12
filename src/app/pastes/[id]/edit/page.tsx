"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { use } from "react";

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

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

export default function EditPastePage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiryDays, setExpiryDays] = useState("7");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);

  const { data: paste, isLoading, error } = api.paste.getById.useQuery({ id });

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

  useEffect(() => {
    if (paste && !isLoading) {
      setTitle(paste.title);
      setContent(paste.content || "");
      setLanguage(paste.language || "plaintext");
      setIsPasswordProtected(paste.isProtected || false);
    }
  }, [paste, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      return;
    }

    updatePaste.mutate({
      id,
      title,
      content,
      language,
      expiryDays: parseInt(expiryDays, 10),
      password: isPasswordProtected && password ? password : undefined,
      removePassword: removePassword,
    });
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
              {error?.message || "Failed to load paste"}
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
          <CardTitle>Edit Paste</CardTitle>
          <CardDescription>
            Update your paste content and settings
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your paste"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your code or text here"
                className="min-h-[300px] font-mono"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="expiry">Extend Expiry</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="expiry">
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              {paste.isProtected ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remove-password"
                      checked={removePassword}
                      onCheckedChange={(checked) => {
                        setRemovePassword(!!checked);
                        if (checked) {
                          setIsPasswordProtected(false);
                        }
                      }}
                    />
                    <Label htmlFor="remove-password">Remove password protection</Label>
                  </div>
                  {!removePassword && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="change-password"
                          checked={isPasswordProtected}
                          onCheckedChange={(checked) => setIsPasswordProtected(!!checked)}
                        />
                        <Label htmlFor="change-password">Change password</Label>
                      </div>
                      {isPasswordProtected && (
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="password-protection"
                    checked={isPasswordProtected}
                    onCheckedChange={(checked) => setIsPasswordProtected(!!checked)}
                  />
                  <Label htmlFor="password-protection">Add password protection</Label>
                </div>
              )}
              {isPasswordProtected && !paste.isProtected && (
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isPasswordProtected && !paste.isProtected}
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePaste.isPending}>
              {updatePaste.isPending ? "Updating..." : "Update Paste"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
} 