/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from '../value-objects/comment-content.vo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Comment } from './comment.entity';
import { CommentCreatedEvent } from '../events/comment-created.event';
import {
  ArgumentInvalidException,
  InvalidCommentOperationException,
} from '../exceptions/comment.exceptions';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { CommentDeletedEvent } from '../events/comment-deleted.event';
class MockCommentResponse {
  constructor(
    public id: Identifier,
    public commentId: Identifier,
    public content?: CommentContent,
  ) {}
  // Add an 'equals' method if your Comment entity's methods rely on it for CommentResponse instances
  equals(other?: MockCommentResponse): boolean {
    if (!other) return false;
    return this.id.equals(other.id);
  }
  // Mimic props if needed by Comment entity, though not directly used by Comment in this version
  get props() {
    return {
      content: this.content,
      commentId: this.commentId,
      userId: Identifier.create(0) /* dummy */,
    };
  }
}
// Replace `import type { CommentResponse } from './comment-response.entity';` in Comment.entity.ts
// with `import { MockCommentResponse as CommentResponse } from './comment-response.entity';` for this test run,
// OR ensure CommentResponse is defined minimally before Comment.
// For simplicity here, I'll assume CommentResponse can be used as MockCommentResponse.
type CommentResponse = MockCommentResponse; // Alias for clarity in tests

describe('Comment Entity (Stable Version)', () => {
  type CommentCreationArgs = Parameters<typeof Comment.create>[0];

  let validCreationArgs: CommentCreationArgs;
  let authorId: Identifier;
  let postId: Identifier;
  let fixedTime: Date;

  beforeEach(() => {
    fixedTime = new Date('2024-03-18T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedTime);

    authorId = Identifier.create(1);
    postId = Identifier.create(101);

    validCreationArgs = {
      content: CommentContent.create('Valid initial content.'),
      userId: authorId,
      postId: postId,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Static create() method', () => {
    it('should create a new Comment with default responses and timestamps', () => {
      const comment = Comment.create(validCreationArgs);

      expect(comment).toBeInstanceOf(Comment);
      expect(comment.id.Value).toBe(0);
      expect(comment.content.Value).toBe('Valid initial content.');
      expect(comment.authorId.equals(authorId)).toBe(true);
      expect(comment.postId.equals(postId)).toBe(true);
      expect(comment.responses).toEqual([]);
      expect(comment.created_at).toEqual(fixedTime);
      expect(comment.updated_at).toEqual(fixedTime);
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentCreatedEvent);
    });

    it('should create a Comment with existing ID and provided timestamps (reconstitution)', () => {
      const entityId = Identifier.create(50);
      const specificCreateTime = new Date('2024-01-01T00:00:00.000Z');
      const specificUpdateTime = new Date('2024-01-01T01:00:00.000Z');
      const reconstitutionArgs: CommentCreationArgs = {
        ...validCreationArgs,
        created_at: specificCreateTime,
        updated_at: specificUpdateTime,
        responses: [],
      };
      const comment = Comment.create(reconstitutionArgs, entityId);

      expect(comment.id.equals(entityId)).toBe(true);
      expect(comment.created_at).toEqual(specificCreateTime);
      expect(comment.updated_at).toEqual(specificUpdateTime);
      expect(comment.domainEvents).toHaveLength(0); // No create event
    });

    it('should throw ArgumentNotProvidedException if content object is not provided', () => {
      const args = { ...validCreationArgs, content: undefined as any };
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment content (CommentContent object) is required for creation.',
      );
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment content (CommentContent object) is required for creation.',
      );
    });

    it('should throw ArgumentNotProvidedException if userId is not provided', () => {
      const args = {
        ...validCreationArgs,
        userId: undefined as unknown as number,
      };
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment author (userId) is required for creation.',
      );
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment author (userId) is required for creation.',
      );
    });

    it('should throw ArgumentInvalidException if userId is not an Identifier', () => {
      const args = {
        ...validCreationArgs,
        userId: 'not-an-identifier' as unknown as number,
      };
      expect(() => Comment.create(args as unknown as any)).toThrow(
        ArgumentInvalidException,
      );
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment author (userId) must be an instance of Identifier.',
      );
    });
    it('should throw ArgumentNotProvidedException if postId is not provided', () => {
      const args = { ...validCreationArgs, postId: undefined as unknown };
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment post ID (postId) is required for creation.',
      );
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment post ID (postId) is required for creation.',
      );
    });

    it('should throw ArgumentInvalidException if postId is not an Identifier', () => {
      const args = {
        ...validCreationArgs,
        postId: 'not-an-identifier' as unknown,
      };
      expect(() => Comment.create(args as unknown as any)).toThrow(
        ArgumentInvalidException,
      );
      expect(() => Comment.create(args as unknown as any)).toThrow(
        'Comment post ID (postId) must be an instance of Identifier.',
      );
    });
  });

  describe('updateContent() method', () => {
    let comment: Comment;
    beforeEach(() => {
      comment = Comment.create(validCreationArgs, Identifier.create(1));
      comment.clearEvents();
    });

    it('should update content, updated_at, and add CommentUpdatedEvent', () => {
      const newContent = CommentContent.create('Updated content here.');
      const updateTime = new Date('2024-03-18T11:00:00.000Z');
      vi.setSystemTime(updateTime);

      comment.updateContent(newContent);

      expect(comment.content.equals(newContent)).toBe(true);
      expect(comment.updated_at).toEqual(updateTime);
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentUpdatedEvent);
    });

    it('should not update or add event if content is the same', () => {
      const originalupdated_at = comment.updated_at;
      comment.updateContent(validCreationArgs.content); // same content
      expect(comment.updated_at).toEqual(originalupdated_at);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw if newContent object is null', () => {
      expect(() => comment.updateContent(null as any)).toThrow(
        'New content (CommentContent object) cannot be null.',
      );
      expect(() => comment.updateContent(null as any)).toThrow(
        'New content (CommentContent object) cannot be null.',
      );
    });
    it('should throw ArgumentNotProvidedException (from VO) when CommentContent is created with only whitespace', () => {
      const MIN_LENGTH_FROM_VO = 1;

      expect(() => CommentContent.create('   ')).toThrowError(
        `Comment content cannot be empty or less than ${MIN_LENGTH_FROM_VO} character(s) after trimming.`,
      );
    });
  });

  describe('addResponse() method', () => {
    let comment: Comment;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let responseAuthor: Identifier;
    beforeEach(() => {
      comment = Comment.create(validCreationArgs, Identifier.create(1)); // comment.id = 1
      responseAuthor = Identifier.create(3);
      comment.clearEvents();
    });

    it('should add a valid response and update updated_at', () => {
      const originalupdated_at = comment.updated_at;
      const responseToAdd = new MockCommentResponse(
        Identifier.create(201),
        comment.id,
      );
      const addTime = new Date('2024-03-18T11:00:00.000Z');
      vi.setSystemTime(addTime);

      comment.addResponse(responseToAdd as any);
      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0]).toBe(responseToAdd);
      expect(comment.updated_at.getTime()).toBeGreaterThanOrEqual(
        originalupdated_at.getTime(),
      );
      expect(comment.updated_at).toEqual(addTime);
    });

    it('should not add a duplicate response (by ID)', () => {
      const responseInstance1 = new MockCommentResponse(
        Identifier.create(201),
        comment.id,
      );
      comment.addResponse(responseInstance1 as any);
      const responseInstance2_SameId = new MockCommentResponse(
        Identifier.create(201),
        comment.id,
      ); // Same ID
      comment.addResponse(responseInstance2_SameId as any);
      expect(comment.responses).toHaveLength(1);
    });

    it('should throw if responseToAdd is null', () => {
      expect(() => comment.addResponse(null as any)).toThrow(
        'Response cannot be null.',
      );
      expect(() => comment.addResponse(null as any)).toThrow(
        'Response cannot be null.',
      );
    });
    it('should throw if responseToAdd.commentId does not match', () => {
      const wrongParentId = Identifier.create(99);
      const responseForOther = new MockCommentResponse(
        Identifier.create(202),
        wrongParentId,
      );
      expect(() => comment.addResponse(responseForOther as any)).toThrow(
        InvalidCommentOperationException,
      );
      expect(() => comment.addResponse(responseForOther as any)).toThrow(
        'Cannot add response: it belongs to a different parent comment.',
      );
    });
    it('should throw if responseToAdd.commentId is null/undefined', () => {
      const responseWithNoParentId = new MockCommentResponse(
        Identifier.create(202),
        undefined as any,
      );
      expect(() => comment.addResponse(responseWithNoParentId as any)).toThrow(
        "Cannot read properties of undefined (reading 'equals')",
      );
    });
  });

  describe('removeResponse() method', () => {
    let comment: Comment;
    let r1: CommentResponse, r2: CommentResponse;
    beforeEach(() => {
      comment = Comment.create(validCreationArgs, Identifier.create(1));
      r1 = new MockCommentResponse(Identifier.create(301), comment.id);
      r2 = new MockCommentResponse(Identifier.create(302), comment.id);
      comment.addResponse(r1 as any);
      comment.addResponse(r2 as any);
      comment.clearEvents();
    });

    it('should remove an existing response and update updated_at', () => {
      const originalupdated_at = comment.updated_at; // Will be time of r2 addition
      const removalTime = new Date('2024-03-18T12:00:00.000Z'); // Ensure this is later
      vi.setSystemTime(removalTime);

      comment.removeResponse(r1.id);
      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0].id.equals(r2.id)).toBe(true);
      expect(comment.updated_at.getTime()).toBeGreaterThanOrEqual(
        originalupdated_at.getTime(),
      );
      expect(comment.updated_at).toEqual(removalTime);
    });
    it('should not change updated_at if response to remove does not exist', () => {
      const originalupdated_at = comment.updated_at;
      comment.removeResponse(Identifier.create(999)); // Non-existent
      expect(comment.responses).toHaveLength(2);
      expect(comment.updated_at).toEqual(originalupdated_at);
    });
    it('should throw if responseIdToRemove is null', () => {
      expect(() => comment.removeResponse(null as any)).toThrow(
        'Response ID to remove cannot be null.',
      );
      expect(() => comment.removeResponse(null as any)).toThrow(
        'Response ID to remove cannot be null.',
      );
    });
  });

  describe('isAuthoredBy() method', () => {
    it('should return true if userId matches', () => {
      const comment = Comment.create(validCreationArgs);
      expect(comment.isAuthoredBy(authorId)).toBe(true);
    });
    it('should return false if userId does not match', () => {
      const comment = Comment.create(validCreationArgs);
      expect(comment.isAuthoredBy(Identifier.create(99))).toBe(false);
    });
    it('should return false if userId is null', () => {
      const comment = Comment.create(validCreationArgs);
      expect(comment.isAuthoredBy(null as any)).toBe(false);
    });
  });

  describe('delete() method', () => {
    it('should add CommentDeletedEvent', () => {
      const comment = Comment.create(validCreationArgs, Identifier.create(1));
      comment.clearEvents();
      comment.delete();
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentDeletedEvent);
    });
  });
});
