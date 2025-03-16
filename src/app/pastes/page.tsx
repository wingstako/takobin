"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Edit, Eye, Lock, Trash2, Code, FileText, ImageIcon, File, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define proper types for paste data
interface Paste {
  id: string;
  title: string;
  content: string;
  language: string | null;
  visibility: string;
  pasteType: string;
  expiresAt: Date | null;
  createdAt: Date;
  isProtected: boolean | null;
  userId: string | null;
  password?: string | null;
  lastAccessedAt: Date;
}

export default function PastesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pasteToDelete, setPasteToDelete] = useState<string | null>(null);

  // Mock data for unauthenticated users
  const mockPastes = [
    { id: '1', title: 'Example JavaScript Code', language: 'javascript', type: 'text', createdAt: new Date(Date.now() - 86400000), expiresAt: new Date(Date.now() + 86400000 * 7) },
    { id: '2', title: 'CSS Snippet', language: 'css', type: 'text', createdAt: new Date(Date.now() - 86400000 * 2), expiresAt: new Date(Date.now() + 86400000 * 14) },
    { id: '3', title: 'Photo Collection', language: 'plaintext', type: 'multimedia', files: 5, createdAt: new Date(Date.now() - 86400000 * 3), expiresAt: null },
    { id: '4', title: 'SQL Query', language: 'sql', type: 'text', createdAt: new Date(Date.now() - 86400000 * 4), expiresAt: new Date(Date.now() + 86400000 * 60) },
    { id: '5', title: 'Video Tutorial', language: 'plaintext', type: 'multimedia', files: 1, createdAt: new Date(Date.now() - 86400000 * 5), expiresAt: new Date(Date.now() + 86400000 * 90) },
  ];

  const { data, isLoading, refetch } = api.paste.getUserPastes.useQuery(
    { page, limit: 12 },
    {
      enabled: status === "authenticated"
    }
  );
  
  const deletePaste = api.paste.delete.useMutation({
    onSuccess: () => {
      toast.success("Paste deleted successfully");
      void refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete paste", {
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (id: string) => {
    setPasteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pasteToDelete) {
      deletePaste.mutate({ id: pasteToDelete });
    }
  };

  const getPasteTypeIcon = (paste: Paste) => {
    const isMultimedia = paste.pasteType === 'multimedia';
    
    if (isMultimedia) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else {
      switch (paste.language) {
        case 'javascript':
        case 'typescript':
        case 'python':
        case 'java':
        case 'csharp':
        case 'cpp':
        case 'go':
        case 'rust':
          return <Code className="h-5 w-5 text-amber-500" />;
        case 'markdown':
        case 'plaintext':
          return <FileText className="h-5 w-5 text-emerald-500" />;
        default:
          return <File className="h-5 w-5 text-slate-500" />;
      }
    }
  };

  const getPreviewContent = (paste: Paste) => {
    const isMultimedia = paste.pasteType === 'multimedia';
    
    if (isMultimedia) {
      return (
        <div className="flex items-center justify-center h-32 bg-slate-100 dark:bg-slate-800 rounded">
          <ImageIcon className="h-10 w-10 text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">
            File Upload
          </span>
        </div>
      );
    } else {
      // For text pastes, show a preview of the content (if available)
      return (
        <div className="h-32 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded text-sm p-2 font-mono">
          <code className="text-xs">
            {paste.content && paste.content.length > 0 ? (
              paste.content.substring(0, 200) + (paste.content.length > 200 ? '...' : '')
            ) : (
              <span className="text-slate-400">No preview available</span>
            )}
          </code>
        </div>
      );
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="px-4 md:px-6 py-8 w-full flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-8 w-full flex justify-center">
      <div className="w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Pastes</h1>
          <p className="text-muted-foreground">Manage your saved pastes and files</p>
        </div>
        
        {status === "unauthenticated" ? (
          <div className="relative">
            {/* Blurred mock cards for unauthenticated users */}
            <div className="filter blur-sm pointer-events-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPastes.map((paste) => (
                  <Card key={paste.id} className="overflow-hidden">
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {paste.type === 'multimedia' ? (
                        <ImageIcon className="h-10 w-10 text-slate-400" />
                      ) : (
                        <Code className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{paste.title}</h3>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button variant="ghost" size="sm" disabled>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Login overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center p-6 rounded-lg max-w-md">
                <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Sign in to view your pastes</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to save and manage your pastes and files across devices.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href="/api/auth/signin">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : data?.pastes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
              <File className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No pastes yet</h3>
            <p className="mb-4 text-muted-foreground max-w-md">
              You don't have any pastes yet. Create your first paste to share code snippets, text or files.
            </p>
            <Button asChild>
              <Link href="/new">Create Your First Paste</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {data?.pastes.map((paste) => (
                <Card key={paste.id} className="overflow-hidden hover:border-primary transition-all">
                  <div className="relative">
                    {getPreviewContent(paste as Paste)}
                    
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {paste.visibility === "private" && (
                        <Badge variant="outline" className="bg-background/80 border-amber-200">
                          <Lock className="h-3 w-3 mr-1 text-amber-500" />
                          Private
                        </Badge>
                      )}
                      {paste.isProtected && (
                        <Badge variant="outline" className="bg-background/80 border-blue-200">
                          <Lock className="h-3 w-3 mr-1 text-blue-500" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPasteTypeIcon(paste as Paste)}
                      <h3 className="font-medium truncate">{paste.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {paste.expiresAt ? (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            Expires {formatDistanceToNow(new Date(paste.expiresAt), { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          <span>Never expires</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/pastes/${paste.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/pastes/${paste.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(paste.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {data?.pagination && data.pagination.total > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 12 + 1} to{" "}
                  {Math.min(page * 12, data.pagination.total)} of{" "}
                  {data.pagination.total} pastes
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page * 12 >= data.pagination.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Paste</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this paste? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePaste.isPending}>
              {deletePaste.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
