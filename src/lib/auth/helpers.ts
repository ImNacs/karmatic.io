import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Gets the current user from the database, creating a new record if necessary.
 * 
 * This function implements a lazy user creation pattern where:
 * - Users are created in the database only when first needed
 * - Handles race conditions gracefully
 * - Syncs user data from Clerk on first access
 * 
 * This approach is more resilient than webhook-only creation because:
 * - It handles webhook failures or delays
 * - Works immediately after user registration
 * - Self-heals if database records are missing
 * 
 * @returns {Promise<User | null>} The user record or null if not authenticated
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function GET() {
 *   const user = await getOrCreateUser();
 *   if (!user) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   
 *   const agencies = await getUserAgencies(user.id);
 *   return Response.json({ agencies });
 * }
 * ```
 */
export async function getOrCreateUser() {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return null;
  }

  // First, try to find the user in our database
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  // If user doesn't exist, fetch from Clerk and create
  if (!user) {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    user = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber,
      },
    });
  }

  return user;
}

/**
 * Requires an authenticated user or throws an error.
 * 
 * This is a convenience function for API routes that must have
 * an authenticated user. It combines authentication checking with
 * automatic user creation, providing a clean interface for
 * protected endpoints.
 * 
 * Use this function when:
 * - The endpoint absolutely requires authentication
 * - You want to fail fast with a clear error
 * - You don't need custom error handling
 * 
 * @returns {Promise<User>} The authenticated user record
 * @throws {Error} When no authenticated user is found
 * 
 * @example
 * ```typescript
 * // In a protected API route
 * export async function POST(req: Request) {
 *   try {
 *     const user = await requireUser();
 *     
 *     // User is guaranteed to exist here
 *     const data = await req.json();
 *     const result = await createUserResource(user.id, data);
 *     
 *     return Response.json({ success: true, data: result });
 *   } catch (error) {
 *     if (error.message === 'User not authenticated') {
 *       return new Response('Unauthorized', { status: 401 });
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function requireUser() {
  const user = await getOrCreateUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}