"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Edit, Eye, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PastesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pasteToDelete, setPasteToDelete] = useState<string | null>(null);

  // Mock data for unauthenticated users
  const mockPastes = [
    { id: '1', title: 'Example JavaScript Code', language: 'javascript', createdAt: new Date(Date.now() - 86400000), expiresAt: new Date(Date.now() + 86400000 * 7) },
    { id: '2', title: 'CSS Snippet', language: 'css', createdAt: new Date(Date.now() - 86400000 * 2), expiresAt: new Date(Date.now() + 86400000 * 14) },
    { id: '3', title: 'React Component', language: 'tsx', createdAt: new Date(Date.now() - 86400000 * 3), expiresAt: new Date(Date.now() + 86400000 * 30) },
    { id: '4', title: 'SQL Query', language: 'sql', createdAt: new Date(Date.now() - 86400000 * 4), expiresAt: new Date(Date.now() + 86400000 * 60) },
    { id: '5', title: 'Python Script', language: 'python', createdAt: new Date(Date.now() - 86400000 * 5), expiresAt: new Date(Date.now() + 86400000 * 90) },
  ];

  const { data, isLoading, refetch } = api.paste.getUserPastes.useQuery(
    { page, limit: 10 },
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

  if (status === "loading") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For authenticated users with loading data
  if (status === "authenticated" && isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>My Pastes</CardTitle>
          <CardDescription>Manage your saved pastes</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "unauthenticated" ? (
            <div className="relative">
              {/* Blurred mock table for unauthenticated users */}
              <div className="filter blur-sm pointer-events-none">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPastes.map((paste) => (
                        <TableRow key={paste.id}>
                          <TableCell className="font-medium">{paste.title}</TableCell>
                          <TableCell>{paste.language}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(paste.expiresAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon" disabled>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" disabled>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" disabled>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Login overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center p-6 rounded-lg max-w-md">
                  <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Sign in to view your pastes</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an account to save and manage your pastes across devices.
                  </p>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/api/auth/signin">Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : data?.pastes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-4 text-muted-foreground">You don't have any pastes yet.</p>
              <Button asChild>
                <Link href="/new">Create Your First Paste</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.pastes.map((paste) => (
                      <TableRow key={paste.id}>
                        <TableCell className="font-medium">{paste.title}</TableCell>
                        <TableCell>{paste.language}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(paste.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(paste.expiresAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/pastes/${paste.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/pastes/${paste.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(paste.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data?.pagination && data.pagination.total > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, data.pagination.total)} of{" "}
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
                      disabled={page * 10 >= data.pagination.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button asChild>
            <Link href="/new">Create New Paste</Link>
          </Button>
        </CardFooter>
      </Card>

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
