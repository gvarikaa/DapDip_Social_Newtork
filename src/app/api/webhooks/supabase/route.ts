/**
 * Supabase Auth Webhook Handler
 * 
 * This route handles webhook events from Supabase Auth
 * Events include:
 * - auth.user.created
 * - auth.user.updated
 * - auth.user.deleted
 * 
 * Configure in Supabase Dashboard:
 * Authentication > Webhooks
 * Create a webhook for each event type and point to this URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, User } from '@prisma/client'
import { createOrUpdateUser, deleteUser } from '@/utils/supabase/auth'

const prisma = new PrismaClient()

// Webhook handler for Supabase Auth events
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (in production, implement proper signature verification)
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET
    
    // In production, you should verify the webhook signature here
    // const signature = req.headers.get('x-supabase-signature')
    // if (!signature || !verifySignature(signature, webhookSecret, await req.text())) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }
    
    // Parse the webhook payload
    const payload = await req.json()
    
    // Get the event type and data
    const eventType = payload.type
    const record = payload.record
    
    if (!eventType || !record) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
    
    console.log(`Received Supabase webhook event: ${eventType}`)
    
    // Handle different event types
    switch (eventType) {
      case 'auth.user.created':
        await handleUserCreated(record)
        break
        
      case 'auth.user.updated':
        await handleUserUpdated(record)
        break
        
      case 'auth.user.deleted':
        await handleUserDeleted(record)
        break
        
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling Supabase webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle user created event
 */
async function handleUserCreated(user: any) {
  try {
    const result = await createOrUpdateUser(user)
    console.log(`User created in database: ${result.id}`)
    return result
  } catch (error) {
    console.error('Error creating user from webhook:', error)
    throw error
  }
}

/**
 * Handle user updated event
 */
async function handleUserUpdated(user: any) {
  try {
    const result = await createOrUpdateUser(user)
    console.log(`User updated in database: ${result.id}`)
    return result
  } catch (error) {
    console.error('Error updating user from webhook:', error)
    throw error
  }
}

/**
 * Handle user deleted event
 */
async function handleUserDeleted(user: any) {
  try {
    await deleteUser(user.id)
    console.log(`User deleted from database: ${user.id}`)
  } catch (error) {
    console.error('Error deleting user from webhook:', error)
    throw error
  }
}

/**
 * Helper function to verify webhook signature
 * This is commented out but should be implemented in production
 */
// function verifySignature(signature: string, secret: string, payload: string): boolean {
//   const crypto = require('crypto')
//   const hmac = crypto.createHmac('sha256', secret)
//   const digest = hmac.update(payload).digest('hex')
//   return signature === digest
// }