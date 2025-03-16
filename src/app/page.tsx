import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center py-8 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Welcome to TakoBin
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl px-2">
            A modern paste bin alternative with syntax highlighting and file uploads.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row w-full px-4 sm:px-0 sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/new">Create New Paste</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/pastes">View Your Pastes</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-12 md:grid-cols-3 px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Syntax Highlighting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share code with beautiful syntax highlighting for over 100 programming languages.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>File Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload images, videos, and other files alongside your text pastes.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Password Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Secure your pastes with password protection for sensitive content.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto max-w-3xl text-center px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create a paste, set an expiry date, and share the link. Your paste will be accessible for up to 30 days
            for registered users, or 7 days for guests. Each time someone views your paste, the expiry date is
            automatically extended.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/new">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
