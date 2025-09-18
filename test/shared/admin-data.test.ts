import { AdminData } from '../../lambda/shared/admin-data.mjs';
import { QueryCommand, DeleteCommand, TransactWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// Mock the AWS SDK
const mockSend = jest.fn();
const mockS3Send = jest.fn();

jest.mock('../../lambda/shared/clients', () => ({
  docClient: {
    send: mockSend
  },
  s3Client: {
    send: mockS3Send
  },
  TABLE_NAME: 'test-table'
}));

describe('AdminData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUser', () => {
    it('should delete all user data including posts', async () => {
      const userItems = [
        { PK: 'USER#user-123', SK: 'PROFILE' },
        { PK: 'USER#user-123', SK: 'FOLLOW#user-456' }
      ];

      const postItems = [
        { PK: 'POST#post-1', SK: 'METADATA', GSI1PK: 'USER#user-123' },
        { PK: 'POST#post-2', SK: 'METADATA', GSI1PK: 'USER#user-123' }
      ];

      // Mock user items query
      mockSend
        .mockResolvedValueOnce({ Items: userItems }) // Query user items
        .mockResolvedValueOnce({ Items: postItems }) // Query posts
        .mockResolvedValue({}); // Delete operations

      const result = await AdminData.deleteUser('user-123');

      expect(result).toEqual({
        deletedItems: 4, // 2 user items + 2 posts
        userId: 'user-123'
      });

      // Should have called delete operations
      expect(mockSend).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
    });

    it('should handle user with no posts', async () => {
      const userItems = [
        { PK: 'USER#user-123', SK: 'PROFILE' }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: userItems }) // Query user items
        .mockResolvedValueOnce({ Items: [] }) // No posts
        .mockResolvedValue({}); // Delete operations

      const result = await AdminData.deleteUser('user-123');

      expect(result.deletedItems).toBe(1);
    });

    it('should throw error when user not found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await expect(AdminData.deleteUser('nonexistent')).rejects.toThrow('User not found');
    });

    it('should handle single item deletion', async () => {
      const userItems = [
        { PK: 'USER#user-123', SK: 'PROFILE' }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: userItems }) // Query user items
        .mockResolvedValueOnce({ Items: [] }) // No posts
        .mockResolvedValue({}); // Delete operations

      await AdminData.deleteUser('user-123');

      // Should use DeleteCommand for single item
      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteCommand));
    });

    it('should handle GSI query failure gracefully', async () => {
      const userItems = [
        { PK: 'USER#user-123', SK: 'PROFILE' }
      ];

      mockSend
        .mockResolvedValueOnce({ Items: userItems }) // Query user items
        .mockRejectedValueOnce(new Error('GSI not found')) // GSI query fails
        .mockResolvedValue({}); // Delete operations

      const result = await AdminData.deleteUser('user-123');

      expect(result.deletedItems).toBe(1);
    });
  });

  describe('cleanupAll', () => {
    it('should delete all items in batches', async () => {
      const items1 = Array.from({ length: 25 }, (_, i) => ({
        PK: `ITEM#${i}`,
        SK: 'DATA'
      }));

      const items2 = Array.from({ length: 10 }, (_, i) => ({
        PK: `ITEM#${i + 25}`,
        SK: 'DATA'
      }));

      mockSend
        .mockResolvedValueOnce({
          Items: items1,
          LastEvaluatedKey: { PK: 'ITEM#24', SK: 'DATA' }
        })
        .mockResolvedValueOnce({}) // First batch delete
        .mockResolvedValueOnce({ Items: items2 }) // Second scan
        .mockResolvedValueOnce({}); // Second batch delete

      const result = await AdminData.cleanupAll();

      expect(result.deletedItems).toBe(35);
      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(mockSend).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
    });

    it('should handle empty table', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      const result = await AdminData.cleanupAll();

      expect(result.deletedItems).toBe(0);
    });
  });

  describe('cleanupS3', () => {
    it('should delete all objects from S3 bucket', async () => {
      const s3Objects = [
        { Key: 'image1.jpg' },
        { Key: 'image2.png' },
        { Key: 'image3.gif' }
      ];

      mockS3Send
        .mockResolvedValueOnce({ Contents: s3Objects }) // List objects
        .mockResolvedValueOnce({}); // Delete objects

      const result = await AdminData.cleanupS3('test-bucket');

      expect(result.deletedObjects).toBe(3);
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(DeleteObjectsCommand));
    });

    it('should handle empty bucket', async () => {
      mockS3Send.mockResolvedValue({ Contents: [] });

      const result = await AdminData.cleanupS3('test-bucket');

      expect(result.deletedObjects).toBe(0);
    });

    it('should handle bucket with no Contents', async () => {
      mockS3Send.mockResolvedValue({});

      const result = await AdminData.cleanupS3('test-bucket');

      expect(result.deletedObjects).toBe(0);
    });

    it('should throw error on S3 failure', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 error'));

      await expect(AdminData.cleanupS3('test-bucket')).rejects.toThrow('S3 error');
    });
  });
});