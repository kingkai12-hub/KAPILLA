import { describe, it, expect, vi } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('Authentication', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.startsWith('$2')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      const isValid = await verifyPassword(hashed, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      const isValid = await verifyPassword(hashed, 'wrongPassword');
      expect(isValid).toBe(false);
    });

    it('should handle legacy plain-text passwords', async () => {
      const password = 'plainTextPassword';
      const isValid = await verifyPassword(password, password);
      expect(isValid).toBe(true);
    });
  });
});
