/**
 * Unit tests for Images shared schema validation
 *
 * Tests that client and server use identical validation rules.
 * Following CLAUDE.md principles for focused, fixture-based testing.
 */

import { describe, it, expect } from 'vitest';

// Import shared schemas for validation testing
import {
  validateUploadUrlRequest,
  validateUploadUrlResponse,
  type UploadUrlRequest,
  type UploadUrlResponse
} from '../../../src/schemas/shared-schemas';

// Test fixtures
const VALID_UPLOAD_URL_REQUEST: UploadUrlRequest = {
  fileName: 'profile-photo.jpg',
  fileType: 'image/jpeg',
  userId: 'user-123',
};

const VALID_UPLOAD_URL_RESPONSE: UploadUrlResponse = {
  uploadUrl: 'https://bucket.s3.amazonaws.com/path/to/file?signature=abc123',
  imageUrl: 'https://bucket.s3.amazonaws.com/path/to/file',
  key: 'users/user-123/posts/uuid-123.jpg',
  fileName: 'uuid-123.jpg',
};

describe('Images Schema Validation', () => {
  describe('validateUploadUrlRequest', () => {
    it('should validate a valid upload URL request successfully', () => {
      const result = validateUploadUrlRequest(VALID_UPLOAD_URL_REQUEST);

      expect(result).toEqual(VALID_UPLOAD_URL_REQUEST);
      expect(result.fileName).toBe('profile-photo.jpg');
      expect(result.fileType).toBe('image/jpeg');
      expect(result.userId).toBe('user-123');
    });

    it('should validate different image file types', () => {
      const validFileTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      validFileTypes.forEach(fileType => {
        const request = {
          ...VALID_UPLOAD_URL_REQUEST,
          fileType
        };

        expect(() => validateUploadUrlRequest(request)).not.toThrow();
      });
    });

    it('should reject upload request with missing fileName', () => {
      const invalidRequest = {
        fileType: 'image/jpeg',
        userId: 'user-123'
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with missing fileType', () => {
      const invalidRequest = {
        fileName: 'profile-photo.jpg',
        userId: 'user-123'
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with missing userId', () => {
      const invalidRequest = {
        fileName: 'profile-photo.jpg',
        fileType: 'image/jpeg'
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with empty fileName', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileName: ''
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with empty fileType', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileType: ''
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with empty userId', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        userId: ''
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with non-image file types', () => {
      const invalidFileTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mp3',
        'application/json',
        'text/html',
        'application/zip'
      ];

      invalidFileTypes.forEach(fileType => {
        const invalidRequest = {
          ...VALID_UPLOAD_URL_REQUEST,
          fileType
        };

        expect(() => validateUploadUrlRequest(invalidRequest)).toThrow('Only image files are allowed');
      });
    });

    it('should reject upload request with file type not starting with image/', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileType: 'document/image'
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow('Only image files are allowed');
    });

    it('should reject upload request with non-string fileName', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileName: 123
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with non-string fileType', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileType: 456
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should reject upload request with non-string userId', () => {
      const invalidRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        userId: 789
      };

      expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
    });

    it('should validate request with various file name formats', () => {
      const validFileNames = [
        'simple.jpg',
        'file-with-dashes.png',
        'file_with_underscores.gif',
        'file with spaces.jpeg',
        'file.with.dots.webp',
        'very-long-file-name-that-should-still-be-valid.jpg',
        'file123.png',
        'FILE-UPPERCASE.JPG'
      ];

      validFileNames.forEach(fileName => {
        const request = {
          ...VALID_UPLOAD_URL_REQUEST,
          fileName
        };

        expect(() => validateUploadUrlRequest(request)).not.toThrow();
      });
    });
  });

  describe('validateUploadUrlResponse', () => {
    it('should validate a valid upload URL response successfully', () => {
      const result = validateUploadUrlResponse(VALID_UPLOAD_URL_RESPONSE);

      expect(result).toEqual(VALID_UPLOAD_URL_RESPONSE);
      expect(result.uploadUrl).toBe('https://bucket.s3.amazonaws.com/path/to/file?signature=abc123');
      expect(result.imageUrl).toBe('https://bucket.s3.amazonaws.com/path/to/file');
      expect(result.key).toBe('users/user-123/posts/uuid-123.jpg');
      expect(result.fileName).toBe('uuid-123.jpg');
    });

    it('should reject upload URL response with missing uploadUrl', () => {
      const invalidResponse = {
        imageUrl: 'https://bucket.s3.amazonaws.com/path/to/file',
        key: 'users/user-123/posts/uuid-123.jpg',
        fileName: 'uuid-123.jpg'
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with missing imageUrl', () => {
      const invalidResponse = {
        uploadUrl: 'https://bucket.s3.amazonaws.com/path/to/file?signature=abc123',
        key: 'users/user-123/posts/uuid-123.jpg',
        fileName: 'uuid-123.jpg'
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with missing key', () => {
      const invalidResponse = {
        uploadUrl: 'https://bucket.s3.amazonaws.com/path/to/file?signature=abc123',
        imageUrl: 'https://bucket.s3.amazonaws.com/path/to/file',
        fileName: 'uuid-123.jpg'
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with missing fileName', () => {
      const invalidResponse = {
        uploadUrl: 'https://bucket.s3.amazonaws.com/path/to/file?signature=abc123',
        imageUrl: 'https://bucket.s3.amazonaws.com/path/to/file',
        key: 'users/user-123/posts/uuid-123.jpg'
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with empty uploadUrl', () => {
      const invalidResponse = {
        ...VALID_UPLOAD_URL_RESPONSE,
        uploadUrl: ''
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with empty imageUrl', () => {
      const invalidResponse = {
        ...VALID_UPLOAD_URL_RESPONSE,
        imageUrl: ''
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with empty key', () => {
      const invalidResponse = {
        ...VALID_UPLOAD_URL_RESPONSE,
        key: ''
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with empty fileName', () => {
      const invalidResponse = {
        ...VALID_UPLOAD_URL_RESPONSE,
        fileName: ''
      };

      expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
    });

    it('should reject upload URL response with non-string fields', () => {
      const fields = ['uploadUrl', 'imageUrl', 'key', 'fileName'];

      fields.forEach(field => {
        const invalidResponse = {
          ...VALID_UPLOAD_URL_RESPONSE,
          [field]: 123
        };

        expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
      });
    });

    it('should validate response with various URL formats', () => {
      const validUrls = [
        'https://bucket.s3.amazonaws.com/file.jpg',
        'https://bucket.s3.us-west-2.amazonaws.com/path/file.jpg',
        'https://cdn.example.com/images/file.jpg',
        'https://example.com/api/files/123/download',
        'https://storage.googleapis.com/bucket/file.jpg'
      ];

      validUrls.forEach(url => {
        const response = {
          ...VALID_UPLOAD_URL_RESPONSE,
          uploadUrl: url,
          imageUrl: url
        };

        expect(() => validateUploadUrlResponse(response)).not.toThrow();
      });
    });

    it('should validate response with various key formats', () => {
      const validKeys = [
        'users/123/posts/file.jpg',
        'uploads/2023/01/01/file.jpg',
        'temp/uuid-123/file.jpg',
        'images/profile/user-456.png',
        'assets/posts/very-long-file-name.jpeg'
      ];

      validKeys.forEach(key => {
        const response = {
          ...VALID_UPLOAD_URL_RESPONSE,
          key
        };

        expect(() => validateUploadUrlResponse(response)).not.toThrow();
      });
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent field types between request and response', () => {
      // Verify that fileName appears in both request and response with same type
      const fileName = 'test-file.jpg';
      const userId = 'user-test';

      const validRequest = {
        ...VALID_UPLOAD_URL_REQUEST,
        fileName,
        userId
      };

      const validResponse = {
        ...VALID_UPLOAD_URL_RESPONSE,
        fileName
      };

      expect(() => validateUploadUrlRequest(validRequest)).not.toThrow();
      expect(() => validateUploadUrlResponse(validResponse)).not.toThrow();
    });

    it('should enforce string requirements consistently', () => {
      const requiredFields = ['fileName', 'fileType', 'userId'];

      requiredFields.forEach(field => {
        const invalidRequest = { ...VALID_UPLOAD_URL_REQUEST, [field]: 123 };
        expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
      });

      const responseFields = ['uploadUrl', 'imageUrl', 'key', 'fileName'];
      responseFields.forEach(field => {
        const invalidResponse = { ...VALID_UPLOAD_URL_RESPONSE, [field]: 123 };
        expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
      });
    });

    it('should enforce non-empty string requirements consistently', () => {
      const requiredFields = ['fileName', 'fileType', 'userId'];

      requiredFields.forEach(field => {
        const invalidRequest = { ...VALID_UPLOAD_URL_REQUEST, [field]: '' };
        expect(() => validateUploadUrlRequest(invalidRequest)).toThrow();
      });

      const responseFields = ['uploadUrl', 'imageUrl', 'key', 'fileName'];
      responseFields.forEach(field => {
        const invalidResponse = { ...VALID_UPLOAD_URL_RESPONSE, [field]: '' };
        expect(() => validateUploadUrlResponse(invalidResponse)).toThrow();
      });
    });

    it('should enforce image file type restriction consistently', () => {
      const nonImageTypes = ['text/plain', 'application/pdf', 'video/mp4'];

      nonImageTypes.forEach(fileType => {
        const invalidRequest = {
          ...VALID_UPLOAD_URL_REQUEST,
          fileType
        };

        expect(() => validateUploadUrlRequest(invalidRequest)).toThrow('Only image files are allowed');
      });
    });

    it('should handle edge cases in file type validation', () => {
      // Test edge cases for image file type validation
      const edgeCases = [
        { fileType: 'image/', shouldPass: true, description: 'empty subtype still starts with image/' },
        { fileType: 'image', shouldPass: false, description: 'missing slash' },
        { fileType: 'IMAGE/JPEG', shouldPass: false, description: 'uppercase (case sensitive)' },
        { fileType: 'image/custom', shouldPass: true, description: 'custom image subtype' },
        { fileType: 'application/image', shouldPass: false, description: 'wrong main type' }
      ];

      edgeCases.forEach(({ fileType, shouldPass, description }) => {
        const request = {
          ...VALID_UPLOAD_URL_REQUEST,
          fileType
        };

        if (shouldPass) {
          expect(() => validateUploadUrlRequest(request)).not.toThrow();
        } else {
          expect(() => validateUploadUrlRequest(request)).toThrow();
        }
      });
    });
  });
});