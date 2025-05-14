/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CommentResponse,
  CommentResponseProps,
} from './comment-response.entity';
import { CommentContent } from '../value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';

describe('CommentResponse Entity', () => {
  type CommentResponseCreationArgs = Omit<
    CommentResponseProps,
    'created_at' | 'updated_at'
  > & {
    created_at?: Date;
    updated_at?: Date;
  };

  let validCreationArgs: CommentResponseCreationArgs;
  let userId: Identifier;
  let parentCommentId: Identifier; // ID of the Comment it's replying to
  let content: CommentContent;
  let fixedTime: Date;

  beforeEach(() => {
    fixedTime = new Date('2024-03-19T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedTime);

    userId = Identifier.create(1);
    parentCommentId = Identifier.create(10);
    content = CommentContent.create('This is a valid response content.'); // Min 1 char by VO

    validCreationArgs = {
      content,
      userId,
      commentId: parentCommentId,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Static create() method', () => {
    it('should create a new CommentResponse instance with default timestamps', () => {
      const response = CommentResponse.create(validCreationArgs);

      expect(response).toBeInstanceOf(CommentResponse);
      expect(response.id.Value).toBe(0); // Default from BaseEntity
      expect(response.content.equals(content)).toBe(true);
      expect(response.userId.equals(userId)).toBe(true);
      expect(response.commentId.equals(parentCommentId)).toBe(true);
      expect(response.created_at).toEqual(fixedTime);
      expect(response.updated_at).toEqual(fixedTime);
      // Assuming CommentResponse does not add domain events on creation by default
      expect(response.domainEvents).toHaveLength(0);
    });

    it('should create a CommentResponse with a specific ID and provided timestamps (reconstitution)', () => {
      const entityId = Identifier.create(55);
      const specificCreateTime = new Date('2024-01-01T00:00:00.000Z');
      const specificUpdateTime = new Date('2024-01-01T01:00:00.000Z');

      const reconstitutionArgs: CommentResponseCreationArgs = {
        ...validCreationArgs,
        created_at: specificCreateTime,
        updated_at: specificUpdateTime,
      };
      const response = CommentResponse.create(reconstitutionArgs, entityId);

      expect(response.id.equals(entityId)).toBe(true);
      expect(response.created_at).toEqual(specificCreateTime);
      expect(response.updated_at).toEqual(specificUpdateTime);
    });

    // Validation tests for create() arguments (as per your entity's create method)
    it('should throw ArgumentNotProvidedException if content object is not provided', () => {
      const args = { ...validCreationArgs, content: undefined as any };
      expect(() => CommentResponse.create(args)).toThrowError(
        'Response content (CommentContent object) is required.',
      );
    });

    it('should throw ArgumentNotProvidedException if userId is not provided', () => {
      const args = { ...validCreationArgs, userId: undefined as any };
      expect(() => CommentResponse.create(args)).toThrowError(
        'Response userId is required.',
      );
    });

    it('should throw ArgumentNotProvidedException if commentId (parentCommentId) is not provided', () => {
      const args = { ...validCreationArgs, commentId: undefined as any };
      expect(() => CommentResponse.create(args)).toThrowError(
        'Response parent commentId is required.',
      );
    });
  });

  describe('updateContent() method', () => {
    let response: CommentResponse;
    const initialCreateTime = new Date('2024-03-19T08:00:00.000Z');

    beforeEach(() => {
      // Create with specific old timestamps
      const creationArgsWithOldTime: CommentResponseCreationArgs = {
        ...validCreationArgs,
        created_at: initialCreateTime,
        updated_at: initialCreateTime,
      };
      response = CommentResponse.create(
        creationArgsWithOldTime,
        Identifier.create(1),
      );
    });

    it('should update content and updated_at timestamp', () => {
      // Ensure new content meets the >= 3 char rule of updateContent
      const newContent = CommentContent.create(
        'Updated response text that is long enough.',
      );
      const updateTime = new Date('2024-03-19T11:00:00.000Z');
      vi.setSystemTime(updateTime); // Simulate time of update

      response.updateContent(newContent);

      expect(response.content.equals(newContent)).toBe(true);
      expect(response.updated_at).toEqual(updateTime);
      expect(response.created_at).toEqual(initialCreateTime); // Should not change
    });

    it('should not update or change updated_at if new content is the same', () => {
      // Ensure original content also meets the >= 3 char rule for this test to be meaningful
      const originalLongEnoughContent = CommentContent.create(
        'Original long enough content.',
      );
      const args = {
        ...validCreationArgs,
        content: originalLongEnoughContent,
        updated_at: initialCreateTime,
      };
      response = CommentResponse.create(args, Identifier.create(1));

      const originalUpdatedAt = response.updated_at;
      response.updateContent(originalLongEnoughContent); // Same content

      expect(response.updated_at).toEqual(originalUpdatedAt);
    });

    it('should throw ArgumentNotProvidedException if newContent object is null', () => {
      expect(() => response.updateContent(null as any)).toThrowError(
        'New content (CommentContent object) cannot be null.',
      );
    });

    it('should throw ArgumentNotProvidedException if newContent.Value has length < 3', () => {
      const shortContent = CommentContent.create('Hi');
      expect(() => response.updateContent(shortContent)).toThrowError(
        'Response content must be at least 3 characters long.',
      );
    });

    it('should throw (from VO) if newContent is created with an empty string', () => {
      // This tests that CommentContent.create itself prevents totally empty content
      const MIN_LENGTH_FROM_VO = 1; // From CommentContent.vo.ts
      expect(() => CommentContent.create('')).toThrowError(
        `Comment content cannot be empty or less than ${MIN_LENGTH_FROM_VO} character(s) after trimming.`,
      );
    });
  });

  describe('Getters', () => {
    it('should return correct values through getters', () => {
      const id = Identifier.create(123);
      const createTime = new Date('2023-01-01T00:00:00.000Z');
      const updateTime = new Date('2023-01-01T01:00:00.000Z');
      const args: CommentResponseCreationArgs = {
        content: CommentContent.create('Getter test content...'),
        userId: Identifier.create(7),
        commentId: Identifier.create(77),
        created_at: createTime,
        updated_at: updateTime,
      };
      const response = CommentResponse.create(args, id);

      expect(response.id.equals(id)).toBe(true);
      expect(response.content.Value).toBe('Getter test content...');
      expect(response.userId.equals(args.userId)).toBe(true);
      expect(response.commentId.equals(args.commentId)).toBe(true);
      expect(response.created_at).toEqual(createTime);
      expect(response.updated_at).toEqual(updateTime);
    });
  });
});
