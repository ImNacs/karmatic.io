import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

export async function requireUser() {
  const user = await getOrCreateUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}