"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/trpc/react";

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

export default function NewPastePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiryDays, setExpiryDays] = useState("7");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");

  const createPaste = api.paste.create.useMutation({
    onSuccess: (data) => {
      router.push(`/pastes/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      return;
    }

    createPaste.mutate({
      title,
      content,
      language,
      expiryDays: parseInt(expiryDays, 10),
      password: isPasswordProtected ? password : undefined,
    });
  };

  return (
    <main className="px-4 md:px-6 py-8 w-full flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create New Paste</CardTitle>
          <CardDescription>
            Share code snippets, text, and more with syntax highlighting
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
                <Label htmlFor="expiry">Expiry</Label>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="password-protection"
                  checked={isPasswordProtected}
                  onCheckedChange={(checked) => setIsPasswordProtected(!!checked)}
                />
                <Label htmlFor="password-protection">Password Protection</Label>
              </div>
              {isPasswordProtected && (
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isPasswordProtected}
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPaste.isPending}>
              {createPaste.isPending ? "Creating..." : "Create Paste"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
} 