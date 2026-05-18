import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DesignTestPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <section>
          <h1 className="text-3xl font-bold text-foreground">
            Design System Test
          </h1>
          <p className="mt-2 text-secondary-foreground">
            Verifying shadcn tokens, Geist font, and component variants.
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            This line uses Geist Mono.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="xs">XS Size</Button>
            <Button size="sm">SM Size</Button>
            <Button size="default">Default Size</Button>
            <Button size="lg">LG Size</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Card</h2>
          <Card>
            <CardHeader>
              <CardTitle>Career Roadmap</CardTitle>
              <CardDescription>
                Your personalized 6-month transition plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Based on your skills in product management and interest in AI
                engineering, here is your recommended path.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="default">View Full Plan</Button>
              <Button variant="secondary">Save for Later</Button>
            </CardFooter>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Form Elements</h2>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" placeholder="Jane Doe" />
            </div>
            <Button className="w-full">Get My Roadmap</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Color Tokens</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-primary" />
              <p className="text-xs text-muted-foreground">primary</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-secondary" />
              <p className="text-xs text-muted-foreground">secondary</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-accent" />
              <p className="text-xs text-muted-foreground">accent</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-destructive" />
              <p className="text-xs text-muted-foreground">destructive</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-muted" />
              <p className="text-xs text-muted-foreground">muted</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg border bg-card" />
              <p className="text-xs text-muted-foreground">card</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg border bg-input" />
              <p className="text-xs text-muted-foreground">input</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 rounded-lg bg-ring" />
              <p className="text-xs text-muted-foreground">ring</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
