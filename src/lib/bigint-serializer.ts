/**
 * Helper to serialize BigInt values for JSON responses
 * BigInt cannot be serialized directly in JSON
 */

/**
 * Converts BigInt fields in an object to strings
 * @param obj Object containing potential BigInt values
 * @returns Object with BigInt values converted to strings
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
 * Global JSON serializer that handles BigInt
 * Can be used as: JSON.stringify(data, jsonReplacer)
 */
export function jsonReplacer(key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Configure global BigInt handling for JSON
 * Call this once at app initialization
 */
export function configureBigIntSerialization() {
  // @ts-ignore
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}