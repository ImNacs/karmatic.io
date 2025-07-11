import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirect_url') || '/';
  
  if (userId) {
    try {
      // Sign out the user
      await clerkClient.signOut({ sessionId: userId });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
  
  redirect(redirectUrl);
}