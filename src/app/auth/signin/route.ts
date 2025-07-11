import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirect_url') || '/';
  
  if (userId) {
    redirect(redirectUrl);
  }
  
  // Redirect to Clerk's sign-in page with return URL
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
  redirect(signInUrl);
}