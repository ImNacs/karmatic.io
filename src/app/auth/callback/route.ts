import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);
  
  // Get the original redirect URL from query params or cookie
  const cookieStore = cookies();
  const redirectUrl = searchParams.get('redirect_url') || 
                     cookieStore.get('auth_redirect')?.value || 
                     '/dashboard';
  
  // Clear the redirect cookie
  if (cookieStore.get('auth_redirect')) {
    cookieStore.delete('auth_redirect');
  }
  
  if (!userId) {
    redirect('/auth/signin');
  }
  
  // Handle post-auth actions (e.g., sync user data)
  try {
    const response = await fetch(`${request.url.origin}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to sync user data');
    }
  } catch (error) {
    console.error('Error in auth callback:', error);
  }
  
  redirect(redirectUrl);
}