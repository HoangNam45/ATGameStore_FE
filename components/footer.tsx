import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-card/50 backdrop-blur-none">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                AT
              </div>
              <span className="font-bold text-xl text-foreground">
                GameStore
              </span>
            </div>

            <div className="flex">
              <a
                href="https://www.facebook.com/racruoino1"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025. All rights reserved. Made by Nam Hoang.</p>
        </div>
      </div>
    </footer>
  );
}
