import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';

function SignInContent() {
  return <SignIn afterSignInUrl="/auth/callback" />;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}