/**
 * @fileoverview Manual user sync endpoint for Clerk-Prisma integration
 * @module app/api/auth/sync-user
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/bigint-serializer';
/**
 * Sync authenticated Clerk user to Prisma database
 * @method POST
 * @returns {Promise<NextResponse>} JSON response with sync status
 * @response {Object} 200 - Success response
 * @response {string} response.message - Status message
 * @response {Object} response.user - Synced user data
 * @response {string} response.user.id - Database user ID
 * @response {string} response.user.clerkUserId - Clerk user ID
 * @response {string} response.user.email - User email
 * @response {string} response.user.firstName - First name
 * @response {string} response.user.lastName - Last name
 * @response {Object} 401 - Not authenticated
 * @response {Object} 400 - Bad request
 * @response {Object} 500 - Server error
 * @example
 * // POST /api/auth/sync-user
 * // Response:
 * {
 *   "message": "User synced successfully",
 *   "user": {
 *     "id": "1",
 *     "clerkUserId": "user_abc123",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe"
 *   }
 * }
 */
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already synced',
        user: serializeBigInt(existingUser)
      });
    }

    // Get user data from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Could not fetch user data' },
        { status: 400 }
      );
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber,
      },
    });

    return NextResponse.json({ 
      message: 'User synced successfully',
      user: serializeBigInt(user)
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}