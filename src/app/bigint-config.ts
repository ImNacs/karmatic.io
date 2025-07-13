/**
 * Global BigInt configuration
 * This file configures BigInt serialization for the entire app
 */

// Configure BigInt to be JSON serializable
if (typeof BigInt !== 'undefined') {
  // @ts-ignore
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}

// Export to ensure this file is included
export {};