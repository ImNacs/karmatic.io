/**
 * @fileoverview BigInt serialization utilities for JSON compatibility
 * @module lib/bigint-serializer
 * @description
 * BigInt values cannot be serialized directly in JSON.stringify().
 * This module provides utilities to handle BigInt serialization.
 */

/**
 * Converts BigInt fields in an object to strings
 * @template T - Object type
 * @param {T} obj - Object containing potential BigInt values
 * @returns {T} Object with BigInt values converted to strings
 * @example
 * ```ts
 * const data = { id: 123n, name: 'Test', count: 456n };
 * const serialized = serializeBigInt(data);
 * // Result: { id: '123', name: 'Test', count: '456' }
 * ```
 */
export function serializeBigInt<T extends Record<string, any>>(obj: T): T {
  const serialized = { ...obj };
  
  for (const key in serialized) {
    if (typeof serialized[key] === 'bigint') {
      serialized[key] = serialized[key].toString() as any;
    } else if (serialized[key] instanceof Date) {
      // Keep dates as is
      continue;
    } else if (typeof serialized[key] === 'object' && serialized[key] !== null) {
      // Recursively handle nested objects
      serialized[key] = serializeBigInt(serialized[key]);
    }
  }
  
  return serialized;
}

/**
 * JSON replacer function that handles BigInt serialization
 * @param {string} key - Object key being serialized
 * @param {any} value - Value being serialized
 * @returns {any} Serialized value (BigInt as string, others unchanged)
 * @example
 * ```ts
 * const data = { id: 123n, name: 'Test' };
 * JSON.stringify(data, jsonReplacer);
 * // Result: '{"id":"123","name":"Test"}'
 * ```
 */
export function jsonReplacer(key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Configure global BigInt handling for JSON serialization
 * @description
 * Modifies BigInt prototype to add toJSON method.
 * Call this once at application initialization.
 * 
 * @example
 * ```ts
 * // In app initialization
 * configureBigIntSerialization();
 * 
 * // Now BigInt values serialize automatically
 * JSON.stringify({ id: 123n }); // '{"id":"123"}'
 * ```
 * @warning Modifies global BigInt prototype
 */
export function configureBigIntSerialization() {
  // @ts-ignore
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}