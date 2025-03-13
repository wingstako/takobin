import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="px-4 md:px-6 py-8 w-full flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>About TakoBin</CardTitle>
          <CardDescription>A modern paste bin alternative</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            TakoBin is a modern paste bin alternative built with Next.js, TypeScript, and tRPC. It provides a
            clean and intuitive interface for sharing code snippets, text, and files with others.
          </p>

          <h3 className="text-lg font-semibold">Features</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Syntax Highlighting</strong> - Share code with beautiful syntax highlighting for over
              100 programming languages.
            </li>
            <li>
              <strong>File Uploads</strong> - Upload images, videos, and other files alongside your text
              pastes.
            </li>
            <li>
              <strong>Password Protection</strong> - Secure your pastes with password protection for sensitive
              content.
            </li>
            <li>
              <strong>Expiry Dates</strong> - Set expiry dates for your pastes. They'll be automatically
              extended when viewed.
            </li>
            <li>
              <strong>User Accounts</strong> - Create an account to manage your pastes and access additional
              features.
            </li>
          </ul>

          <h3 className="text-lg font-semibold">How It Works</h3>
          <p>
            Create a paste, set an expiry date, and share the link. Your paste will be accessible for up to 30
            days for registered users, or 7 days for guests. Each time someone views your paste, the expiry
            date is automatically extended.
          </p>

          <h3 className="text-lg font-semibold">Technology Stack</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Next.js - React framework for server-rendered applications</li>
            <li>TypeScript - Typed JavaScript for better developer experience</li>
            <li>tRPC - End-to-end typesafe APIs</li>
            <li>Tailwind CSS - Utility-first CSS framework</li>
            <li>shadcn/ui - Beautifully designed components</li>
            <li>Drizzle ORM - TypeScript ORM for SQL databases</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 