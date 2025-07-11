import { SignUp } from '@clerk/nextjs';
import { Suspense } from 'react';

function SignUpContent() {
  return <SignUp afterSignUpUrl="/auth/callback" />;
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Suspense fallback={<div>Loading...</div>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}