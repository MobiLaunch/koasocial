// Shared validation utilities for edge functions

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Handle format: @username@instance.domain or username@instance.domain
const HANDLE_REGEX = /^@?[a-zA-Z0-9_]{1,64}@[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

// URL validation (http/https only)
const URL_REGEX = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9](:[0-9]+)?(\/[^\s]*)?$/;

// Maximum lengths
export const MAX_HANDLE_LENGTH = 100;
export const MAX_URL_LENGTH = 2048;
export const MAX_CONTENT_LENGTH = 5000;
export const MAX_JSON_SIZE = 100 * 1024; // 100KB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a UUID string
 */
export function validateUUID(value: unknown, fieldName = 'id'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (!UUID_REGEX.test(value)) {
    return { valid: false, error: `${fieldName} is not a valid UUID` };
  }
  return { valid: true };
}

/**
 * Validate a handle (e.g., @user@instance.domain)
 */
export function validateHandle(value: unknown): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Handle must be a string' };
  }
  if (value.length < 3) {
    return { valid: false, error: 'Handle is too short' };
  }
  if (value.length > MAX_HANDLE_LENGTH) {
    return { valid: false, error: 'Handle is too long' };
  }
  if (!HANDLE_REGEX.test(value)) {
    return { valid: false, error: 'Invalid handle format. Use @username@instance.domain' };
  }
  return { valid: true };
}

/**
 * Validate a URL string
 */
export function validateUrl(value: unknown, fieldName = 'url'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.length > MAX_URL_LENGTH) {
    return { valid: false, error: `${fieldName} is too long` };
  }
  if (!URL_REGEX.test(value)) {
    return { valid: false, error: `${fieldName} is not a valid URL` };
  }
  // Additional check using URL constructor
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: `${fieldName} must use http or https protocol` };
    }
  } catch {
    return { valid: false, error: `${fieldName} is not a valid URL` };
  }
  return { valid: true };
}

/**
 * Validate a string with length limits
 */
export function validateString(
  value: unknown, 
  fieldName: string, 
  minLength = 1, 
  maxLength = MAX_CONTENT_LENGTH
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} is too short` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long` };
  }
  return { valid: true };
}

/**
 * Validate ActivityPub activity type
 */
const VALID_ACTIVITY_TYPES = [
  'Accept', 'Add', 'Announce', 'Arrive', 'Block', 'Create', 
  'Delete', 'Dislike', 'Flag', 'Follow', 'Ignore', 'Invite',
  'Join', 'Leave', 'Like', 'Listen', 'Move', 'Offer', 'Question',
  'Reject', 'Read', 'Remove', 'TentativeReject', 'TentativeAccept',
  'Travel', 'Undo', 'Update', 'View'
];

export function validateActivityType(type: unknown): ValidationResult {
  if (typeof type !== 'string') {
    return { valid: false, error: 'Activity type must be a string' };
  }
  if (!VALID_ACTIVITY_TYPES.includes(type)) {
    return { valid: false, error: `Invalid activity type: ${type}` };
  }
  return { valid: true };
}

/**
 * Validate an ActivityPub activity object
 */
export function validateActivity(activity: unknown): ValidationResult {
  if (!activity || typeof activity !== 'object') {
    return { valid: false, error: 'Activity must be an object' };
  }
  
  const act = activity as Record<string, unknown>;
  
  // Validate type
  const typeResult = validateActivityType(act.type);
  if (!typeResult.valid) {
    return typeResult;
  }
  
  // Validate actor URL
  if (act.actor) {
    const actorResult = validateUrl(act.actor, 'actor');
    if (!actorResult.valid) {
      return actorResult;
    }
  } else {
    return { valid: false, error: 'Activity must have an actor' };
  }
  
  // Validate id URL if present
  if (act.id) {
    const idResult = validateUrl(act.id, 'id');
    if (!idResult.valid) {
      return idResult;
    }
  }
  
  return { valid: true };
}

/**
 * Check JSON payload size
 */
export function validateJsonSize(json: string): ValidationResult {
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > MAX_JSON_SIZE) {
    return { valid: false, error: 'Request payload too large' };
  }
  return { valid: true };
}

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(value: string): string {
  // Remove null bytes and other control characters
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Parse a handle into username and instance
 */
export function parseHandle(handle: string): { username: string; instance: string } | null {
  const validation = validateHandle(handle);
  if (!validation.valid) {
    return null;
  }
  
  // Remove leading @ if present
  const cleaned = handle.startsWith('@') ? handle.slice(1) : handle;
  const parts = cleaned.split('@');
  
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  
  return {
    username: sanitizeString(parts[0].toLowerCase()),
    instance: sanitizeString(parts[1].toLowerCase()),
  };
}
