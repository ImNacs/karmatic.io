'use client';

import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function AuthHeader() {
  return (
    <div className="flex items-center gap-4">
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="default" size="sm">
            Iniciar Sesión
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}