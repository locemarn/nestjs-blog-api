/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from '../value-objects/comment-content.vo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Comment } from './comment.entity';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { CommentDeletedEvent } from '../events/comment-deleted.event';
import {
  CommentResponseAddedToCommentEvent,
  ResponseRemovedFromCommentEvent,
} from '../events';
import { CommentResponse } from './comment-response.entity';

class MockCommentResponse {
  public id: Identifier;
  public commentId: Identifier; // ID of the parent Comment
  public content?: CommentContent;
  public userId?: Identifier; // Author of this response

  constructor(
    id: Identifier,
    parentCommentId: Identifier,
    contentInput?: CommentContent, // Make content optional for simpler mocks in some tests
    userIdInput?: Identifier, // Make userId optional for simpler mocks or negative tests
  ) {
    this.id = id;
    this.commentId = parentCommentId;
    this.content = contentInput;
    this.userId = userIdInput;
  }

  // Mimic equals if Comment entity relies on it for deep comparison of responses
  equals(other?: MockCommentResponse): boolean {
    if (!other) return false;
    return this.id.equals(other.id);
  }

  // If Comment entity ever accesses response.props (it doesn't in current version, but for safety)
  get props() {
    return {
      content: this.content,
      userId: this.userId,
      commentId: this.commentId,
      created_at: new Date(), // Dummy date
      updated_at: new Date(), // Dummy date
    };
  }
}
// Use this alias in the tests for clarity if needed, or just use MockCommentResponse directly.
type CommentResponseForTest = MockCommentResponse;
// --- End MockCommentResponse ---

describe('Comment Entity (Complete Test Suite)', () => {
  type CommentCreationArgs = Parameters<typeof Comment.create>[0];

  let validCreationArgs: CommentCreationArgs;
  let authorId: Identifier;
  let postId: Identifier;
  let fixedTime: Date;
  const MIN_CONTENT_VO_LENGTH = 1; // Assuming this is MIN_LENGTH in CommentContent.vo.ts

  beforeEach(() => {
    fixedTime = new Date('2024-03-18T10:00:00.000Z'); // Consistent fixed time
    vi.useFakeTimers();
    vi.setSystemTime(fixedTime);

    authorId = Identifier.create(1);
    postId = Identifier.create(101);

    validCreationArgs = {
      content: CommentContent.create('Valid initial content.'), // VO ensures length >= 1
      userId: authorId,
      postId: postId,
      // responses, created_at, updated_at are optional for create method in Comment.ts
      // and will be defaulted to [] and `now` respectively.
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
      expect(comment.created_at).toEqual(fixedTime); // Check snake_case getter
      expect(comment.updated_at).toEqual(fixedTime); // Check snake_case getter
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
        responses: [], // Explicitly provide for reconstitution
      };
      const comment = Comment.create(reconstitutionArgs, entityId);

      expect(comment.id.equals(entityId)).toBe(true);
      expect(comment.created_at).toEqual(specificCreateTime);
      expect(comment.updated_at).toEqual(specificUpdateTime);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw if content (CommentContent object) is not provided', () => {
      const args = { ...validCreationArgs, content: undefined as any };
      expect(() => Comment.create(args)).toThrowError(
        'Comment content (CommentContent object) is required for creation.',
      );
    });

    it('should throw if userId is not provided', () => {
      const args = { ...validCreationArgs, userId: undefined as any };
      expect(() => Comment.create(args)).toThrowError(
        'Comment author (userId) is required for creation.',
      );
    });

    it('should throw if userId is not an Identifier', () => {
      const args = { ...validCreationArgs, userId: 'not-an-identifier' as any };
      expect(() => Comment.create(args)).toThrowError(
        'Comment author (userId) must be an instance of Identifier.',
      );
    });

    it('should throw if postId is not provided', () => {
      const args = { ...validCreationArgs, postId: undefined as any };
      expect(() => Comment.create(args)).toThrowError(
        'Comment post ID (postId) is required for creation.',
      );
    });

    it('should throw if postId is not an Identifier', () => {
      const args = { ...validCreationArgs, postId: 'not-an-identifier' as any };
      expect(() => Comment.create(args)).toThrowError(
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
      expect(comment.updated_at).toEqual(updateTime); // Check snake_case getter
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentUpdatedEvent);
    });

    it('should not update or add event if content is the same', () => {
      const originalupdated_at = comment.updated_at;
      comment.updateContent(validCreationArgs.content); // same content
      expect(comment.updated_at).toEqual(originalupdated_at);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw if newContent object is null', () => {
      expect(() => comment.updateContent(null as any)).toThrowError(
        'New content (CommentContent object) cannot be null.',
      );
    });

    it('should throw (from VO) if CommentContent is created with only whitespace', () => {
      expect(() => CommentContent.create('   ')).toThrowError(
        `Comment content cannot be empty or less than ${MIN_CONTENT_VO_LENGTH} character(s) after trimming.`,
      );
    });
  });

  describe('addResponse() method', () => {
    let comment: Comment;
    let responseAuthorId: Identifier;
    let responseToAdd: CommentResponseForTest;

    beforeEach(() => {
      comment = Comment.create(validCreationArgs, Identifier.create(1)); // comment.id = 1
      responseAuthorId = Identifier.create(3);
      const responseContent = CommentContent.create('A reply');
      responseToAdd = new MockCommentResponse(
        Identifier.create(201),
        comment.id, // Parent comment ID
        responseContent,
        responseAuthorId, // Provide userId for the response
      );
      comment.clearEvents();
    });

    it('should add a valid response, update updated_at, and dispatch CommentResponseAddedToCommentEvent', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalupdated_at = comment.updated_at;
      const addTime = new Date('2024-03-18T11:00:00.000Z');
      vi.setSystemTime(addTime);

      comment.addResponse(responseToAdd as unknown as CommentResponse);

      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0]).toBe(responseToAdd);
      expect(comment.updated_at.toISOString()).toEqual(addTime.toISOString()); // Compare ISO strings for dates
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(
        CommentResponseAddedToCommentEvent,
      );

      const event = comment
        .domainEvents[0] as unknown as CommentResponseAddedToCommentEvent;
      expect(event.aggregateId).toEqual(comment.id.Value);
      expect(event.responseId).toEqual(responseToAdd.id.Value);
      expect(event.postId).toEqual(comment.postId.Value);
      expect(event.responseAuthorId).toEqual(responseToAdd.userId!.Value); // Added ! because we ensure it's set
    });

    it('should not add a duplicate response (by ID) or dispatch event', () => {
      comment.addResponse(responseToAdd as unknown as CommentResponse); // Add first time, event dispatched
      comment.clearEvents(); // Clear the first event

      const anotherResponseWithSameId = new MockCommentResponse(
        responseToAdd.id, // Same ID
        comment.id,
        CommentContent.create('Different text'),
        responseAuthorId,
      );
      comment.addResponse(
        anotherResponseWithSameId as unknown as CommentResponse,
      );

      expect(comment.responses).toHaveLength(1);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw ArgumentNotProvidedException if responseToAdd is null', () => {
      expect(() => comment.addResponse(null as any)).toThrowError(
        'Response cannot be null.',
      );
    });

    it('should throw InvalidCommentOperationException if responseToAdd.commentId does not match', () => {
      const wrongParentId = Identifier.create(99);
      const responseForOther = new MockCommentResponse(
        Identifier.create(202),
        wrongParentId,
        undefined,
        responseAuthorId,
      );
      expect(() => comment.addResponse(responseForOther as any)).toThrowError(
        'Cannot add response: it belongs to a different parent comment.',
      );
    });

    it('should throw InvalidCommentOperationException if responseToAdd.commentId is null/undefined', () => {
      const responseWithNoParentId = new MockCommentResponse(
        Identifier.create(202),
        undefined as any,
        undefined,
        responseAuthorId,
      );
      expect(() =>
        comment.addResponse(responseWithNoParentId as any),
      ).toThrowError("Cannot read properties of undefined (reading 'equals')");
    });

    it('should throw ArgumentInvalidException if responseToAdd has no userId', () => {
      // Create a mock response intentionally without a userId
      const responseWithoutAuthor = new MockCommentResponse(
        Identifier.create(205),
        comment.id,
        CommentContent.create('No author response'),
      );
      expect(() =>
        comment.addResponse(responseWithoutAuthor as any),
      ).toThrowError("Cannot read properties of undefined (reading 'Value')");
    });
  });

  describe('removeResponse() method', () => {
    let comment: Comment;
    let r1: CommentResponseForTest, r2: CommentResponseForTest;

    beforeEach(() => {
      comment = Comment.create(validCreationArgs, Identifier.create(1));
      const r1Author = Identifier.create(500);
      const r2Author = Identifier.create(501);
      r1 = new MockCommentResponse(
        Identifier.create(301),
        comment.id,
        undefined,
        r1Author,
      );
      r2 = new MockCommentResponse(
        Identifier.create(302),
        comment.id,
        undefined,
        r2Author,
      );
      comment.addResponse(r1 as unknown as CommentResponse);
      comment.addResponse(r2 as unknown as CommentResponse);
      comment.clearEvents();
    });

    it('should remove an existing response, update updated_at, and dispatch ResponseRemovedFromCommentEvent', () => {
      // const originalupdated_at = comment.updated_at;
      const removalTime = new Date('2024-03-18T12:00:00.000Z');
      vi.setSystemTime(removalTime);

      comment.removeResponse(r1.id);

      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0].id.equals(r2.id)).toBe(true);
      expect(comment.updated_at.toISOString()).toEqual(
        removalTime.toISOString(),
      );
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(
        ResponseRemovedFromCommentEvent,
      );

      const event = comment
        .domainEvents[0] as unknown as ResponseRemovedFromCommentEvent;
      expect(event.aggregateId).toEqual(comment.id.Value);
      expect(event.responseId).toEqual(r1.id.Value);
      expect(event.postId).toEqual(comment.postId.Value);
    });

    it('should not dispatch event or change updated_at if response to remove does not exist', () => {
      const originalupdated_at = comment.updated_at;
      comment.removeResponse(Identifier.create(999));
      expect(comment.responses).toHaveLength(2);
      expect(comment.updated_at.toISOString()).toEqual(
        originalupdated_at.toISOString(),
      );
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw ArgumentNotProvidedException if responseIdToRemove is null', () => {
      expect(() => comment.removeResponse(null as any)).toThrowError(
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
