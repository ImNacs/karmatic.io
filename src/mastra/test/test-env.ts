/**
 * Test environment variables loading
 */

console.log("Environment test:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("APIFY_API_TOKEN:", process.env.APIFY_API_TOKEN ? "✅ Loaded" : "❌ Not loaded");
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "✅ Loaded" : "❌ Not loaded");

// Load dotenv manually for testing
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log("\nAfter manual dotenv load:");
console.log("APIFY_API_TOKEN:", process.env.APIFY_API_TOKEN ? "✅ Loaded" : "❌ Not loaded");