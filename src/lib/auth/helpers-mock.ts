import { auth, currentUser } from '@clerk/nextjs/server';

// Temporary mock version that doesn't use database
export async function getOrCreateUser() {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return null;
  }

  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  // Return a mock user object that matches our User type
  return {
    id: clerkUserId,
    clerkUserId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,
    createdAt: new Date(clerkUser.createdAt),
    updatedAt: new Date(),
  };
}

export async function requireUser() {
  const user = await getOrCreateUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}