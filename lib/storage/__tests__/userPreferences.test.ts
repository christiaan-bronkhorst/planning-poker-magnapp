import {
  getUserPreferences,
  saveUserPreferences,
  clearUserPreferences,
  generateUserId,
  validateUserName,
} from '../userPreferences';

describe('userPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should return null when no preferences are stored', () => {
      const result = getUserPreferences();
      expect(result).toBeNull();
    });

    it('should return stored preferences', () => {
      const mockPreferences = {
        id: 'test-id',
        name: 'Test User',
        avatar: 'cat',
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('magnapp_user_preferences', JSON.stringify(mockPreferences));

      const result = getUserPreferences();
      expect(result).toEqual({
        ...mockPreferences,
        lastUpdated: new Date(mockPreferences.lastUpdated),
      });
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('magnapp_user_preferences', 'invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = getUserPreferences();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('saveUserPreferences', () => {
    it('should save new preferences with generated ID', () => {
      const preferences = {
        name: 'Test User',
        avatar: 'dog',
      };

      const result = saveUserPreferences(preferences);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test User');
      expect(result.avatar).toBe('dog');
      expect(result.lastUpdated).toBeInstanceOf(Date);

      const stored = JSON.parse(localStorage.getItem('magnapp_user_preferences') || '{}');
      expect(stored.name).toBe('Test User');
    });

    it('should preserve existing ID when updating preferences', () => {
      const existingId = 'existing-id-123';
      const existing = {
        id: existingId,
        name: 'Old Name',
        avatar: 'cat',
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('magnapp_user_preferences', JSON.stringify(existing));

      const result = saveUserPreferences({
        name: 'New Name',
        avatar: 'dog',
      });

      expect(result.id).toBe(existingId);
      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('dog');
    });
  });

  describe('clearUserPreferences', () => {
    it('should remove stored preferences', () => {
      localStorage.setItem('magnapp_user_preferences', 'test-data');
      
      clearUserPreferences();
      
      expect(localStorage.getItem('magnapp_user_preferences')).toBeNull();
    });

    it('should handle clearing when no preferences exist', () => {
      expect(() => clearUserPreferences()).not.toThrow();
    });
  });

  describe('generateUserId', () => {
    it('should generate a valid UUID', () => {
      const id = generateUserId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateUserId();
      const id2 = generateUserId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateUserName', () => {
    it('should accept valid names', () => {
      expect(validateUserName('John')).toEqual({ valid: true });
      expect(validateUserName('Jane Doe')).toEqual({ valid: true });
      expect(validateUserName('User_123')).toEqual({ valid: true });
      expect(validateUserName('Test-User')).toEqual({ valid: true });
    });

    it('should reject empty names', () => {
      expect(validateUserName('')).toEqual({
        valid: false,
        error: 'Name is required',
      });
      expect(validateUserName('   ')).toEqual({
        valid: false,
        error: 'Name is required',
      });
    });

    it('should reject names that are too short', () => {
      expect(validateUserName('AB')).toEqual({
        valid: false,
        error: 'Name must be at least 3 characters',
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(21);
      expect(validateUserName(longName)).toEqual({
        valid: false,
        error: 'Name must be 20 characters or less',
      });
    });

    it('should reject names with invalid characters', () => {
      expect(validateUserName('User@123')).toEqual({
        valid: false,
        error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores',
      });
      expect(validateUserName('Name!')).toEqual({
        valid: false,
        error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores',
      });
    });

    it('should trim whitespace before validation', () => {
      expect(validateUserName('  John  ')).toEqual({ valid: true });
    });
  });
});