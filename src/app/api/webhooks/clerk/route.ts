/**
 * @fileoverview Clerk webhook handler for user lifecycle events
 * @module app/api/webhooks/clerk
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Handle Clerk webhook events for user synchronization
 * @method POST
 * @param {Request} req - Webhook request from Clerk
 * @returns {Promise<Response>} Webhook processing response
 * @webhook {string} header.svix-id - Svix ID header
 * @webhook {string} header.svix-timestamp - Svix timestamp header
 * @webhook {string} header.svix-signature - Svix signature header
 * @response {string} 200 - Webhook processed successfully
 * @response {string} 400 - Invalid headers or verification failed
 * @response {string} 500 - Processing error
 * @handles user.created - Create user in database
 * @handles user.updated - Update user in database
 * @handles user.deleted - Remove user from database
 * @example
 * // Webhook payload for user.created
 * {
 *   "type": "user.created",
 *   "data": {
 *     "id": "user_abc123",
 *     "email_addresses": [{
 *       "email_address": "user@example.com"
 *     }],
 *     "first_name": "John",
 *     "last_name": "Doe"
 *   }
 * }
 */
export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret from environment variable
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook events
  const eventType = evt.type;
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data;
    
    try {
      await prisma.user.upsert({
        where: { clerkUserId: id },
        update: {
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
          phoneNumber: phone_numbers?.[0]?.phone_number,
        },
        create: {
          clerkUserId: id,
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
          phoneNumber: phone_numbers?.[0]?.phone_number,
        },
      });
      
      console.log(`User ${eventType}: ${id}`);
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
      return new Response('Error processing user event', { status: 500 });
    }
  }
  
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    
    try {
      await prisma.user.delete({
        where: { clerkUserId: id },
      });
      
      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}