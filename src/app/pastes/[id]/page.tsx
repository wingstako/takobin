"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Clipboard, Share2, Paperclip, Image } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/code-block";

export default function PastePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: paste, refetch, isLoading, error } = api.paste.getById.useQuery({ id, password });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      <div className="container py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error.message === "FORBIDDEN" ? "This paste has expired." : "Failed to load paste."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error.message === "FORBIDDEN"
                ? "The paste you're trying to access has expired and is no longer available."
                : "There was an error loading this paste. It may have been deleted or may not exist."}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If paste is password protected and content is not available
  if (paste?.isProtected && !paste.content) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>{paste.title}</CardTitle>
            <CardDescription>This paste is password protected</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
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
            <CardFooter>
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
      <div className="container py-8">
        <Card className="mx-auto max-w-4xl">
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{paste.title}</CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                {paste.expiresAt && (
                  <> · Expires {formatDistanceToNow(new Date(paste.expiresAt), { addSuffix: true })}</>
                )}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy content">
                <Clipboard className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={shareUrl} title="Share URL">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={exportToCarbon}
                title="Export as image (Carbon)"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.push(`/pastes/${id}/files`)}
                title="Manage files"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <CodeBlock code={paste.content ?? ""} language={paste.language ?? "plaintext"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
