"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { AlertTriangle, LogOut, User, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllPastes = api.paste.deleteAllUserPastes.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "All pastes deleted successfully");
      setConfirmDeleteOpen(false);
      setIsDeleting(false);
    },
    onError: (error) => {
      toast.error("Failed to delete pastes", {
        description: error.message,
      });
      setIsDeleting(false);
    },
  });

  // If not authenticated, redirect to home
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Loading your profile...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  const handleDeleteAllPastes = () => {
    setIsDeleting(true);
    deleteAllPastes.mutate();
  };

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Profile Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </h3>
            <Separator />
            <div className="flex items-center space-x-4">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name ?? "User"}
                  className="h-16 w-16 rounded-full" 
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{session?.user?.name ?? "User"}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security
            </h3>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>

          {/* Data Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Data Management
            </h3>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Warning: The following actions are irreversible and will permanently delete your data.
            </p>
            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete All Pastes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. It will permanently delete all your pastes and associated files.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAllPastes} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 