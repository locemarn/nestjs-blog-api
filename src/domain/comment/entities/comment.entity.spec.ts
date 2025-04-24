import { Identifier } from 'src/domain/shared/identifier';
import { Comment, CommentProps } from './comment.entity';
import { beforeEach, describe, expect, it } from 'vitest';
import { CommentContent } from '../value-objects/comment-content.vo';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { CommentResponseAddedToCommentEvent } from '../events/comment-response-added-to-comment.event';
import { CommentResponse } from './comment-response.entity';
import { InvalidCommentOperationException } from '../exceptions/comment.exceptions';

describe('Comment Entity', () => {
  let validCommentProps: CommentProps;
  let authorId: Identifier;
  let postId: Identifier;
  let responseAuthorId: Identifier;

  beforeEach(() => {
    authorId = Identifier.create(1);
    postId = Identifier.create(100);
    responseAuthorId = Identifier.create(2);

    validCommentProps = {
      content: CommentContent.create('This is valid comment content.'),
      userId: authorId,
      postId: postId,
      responses: [],
    };
  });

  describe('create() Factory Method', () => {
    it('should create a comment instance with a valid props', () => {
      const comment = Comment.create(validCommentProps);

      expect(comment).toBeInstanceOf(Comment);
      expect(comment.id.Value).toBe(0);
      expect(comment.content.Value).toBe('This is valid comment content.');
      expect(comment.authorId.equals(authorId)).toBe(true);
      expect(comment.postId.equals(postId)).toBe(true);
      expect(comment.responses).toEqual([]);
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentCreatedEvent);
      const event = comment.domainEvents[0] as CommentCreatedEvent;
      expect(event.aggregateId).toBe(0);
      expect(event.postId).toBe(postId.Value);
      expect(event.authorId).toBe(authorId.Value);
    });

    it('should create a comment with a specific ID (reconstitution)', () => {
      const commentId = Identifier.create(123);
      const comment = Comment.create(validCommentProps, commentId);

      expect(comment.id.equals(commentId)).toBe(true);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should initialize responses as empty array if not provided', () => {
      const propsWithoutResponses = { ...validCommentProps };
      delete propsWithoutResponses.responses;
      const comment = Comment.create(propsWithoutResponses);
      expect(comment.responses).toBeDefined();
      expect(comment.responses).toEqual([]);
    });

    it('should throw if content is not provided', () => {
      const invalidProps = {
        ...validCommentProps,
        content: null as unknown as string,
      };
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment content is required.');
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment content is required.');
    });

    it('should throw if userId is not provided', () => {
      const invalidProps = {
        ...validCommentProps,
        userId: null as unknown as string,
      };
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment author (userId) is required.');
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment author (userId) is required.');
    });

    it('should throw if postId is not provided', () => {
      const invalidProps = {
        ...validCommentProps,
        postId: null as unknown as string,
      };
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment post ID (postId) is required.');
      expect(() =>
        Comment.create(invalidProps as unknown as CommentProps),
      ).toThrow('Comment post ID (postId) is required.');
    });
  });

  describe('updateContent() Method', () => {
    it('should update the content and add CommentUpdatedEvent', () => {
      const comment = Comment.create(validCommentProps, Identifier.create(1));
      comment.clearEvents(); // Clear create event if any
      const newContent = CommentContent.create('Updated comment content.');

      comment.updateContent(newContent);

      expect(comment.content.equals(newContent)).toBe(true);
      // If managing updated_at in domain: expect(comment.updated_at > initialupdated_at).toBe(true);
      expect(comment.domainEvents).toHaveLength(1);
      expect(comment.domainEvents[0]).toBeInstanceOf(CommentUpdatedEvent);
      expect((comment.domainEvents[0] as CommentUpdatedEvent).aggregateId).toBe(
        1,
      );
    });

    it('should not update or add event if content is the same', () => {
      const comment = Comment.create(validCommentProps, Identifier.create(1));
      comment.clearEvents();

      comment.updateContent(validCommentProps.content); // Update with the same content

      expect(comment.content.equals(validCommentProps.content)).toBe(true);
      // If managing updated_at in domain: expect(comment.updated_at).toEqual(initialUpdateTimestamp);
      expect(comment.domainEvents).toHaveLength(0);
    });

    it('should throw if new content is null or empty', () => {
      const comment = Comment.create(validCommentProps, Identifier.create(1));
      expect(() =>
        comment.updateContent(null as unknown as CommentContent),
      ).toThrow('Response cannot be null.');
      // Check based on VO validation:
      expect(() => comment.updateContent(CommentContent.create(''))).toThrow(
        'Comment content cannot be empty.',
      );
    });
  });

  describe('addResponse() Method', () => {
    let comment: Comment;
    let response: CommentResponse;
    let responseId: Identifier;

    beforeEach(() => {
      comment = Comment.create(validCommentProps, Identifier.create(1)); // Parent comment ID = 1
      responseId = Identifier.create(201); // Response ID
      const responseProps = {
        content: CommentContent.create('This is a reply.'),
        userId: responseAuthorId, // Author of the response
        commentId: comment.id, // Link to parent comment (ID=1)
        postId: postId,
      };
      response = CommentResponse.create(responseProps, responseId);
      comment.clearEvents(); // Clear parent comment's create event
    });

    it('should add a valid response to the internal list', () => {
      comment.addResponse(response);
      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0]).toBe(response);
      // If managing updatedAt in domain: expect(comment.updatedAt > initialUpdatedAt).toBe(true);
    });

    it('should NOT add a domain event when adding a response', () => {
      comment.addResponse(response);
      expect(
        comment.domainEvents.some(
          (e) => e instanceof CommentResponseAddedToCommentEvent,
        ),
      ).toBe(false);
      expect(comment.domainEvents.length).toBe(0); // No events should be added by this method
    });

    it('should throw if response is null', () => {
      expect(() =>
        comment.addResponse(null as unknown as CommentResponse),
      ).toThrow('Response cannot be null.');
    });

    it('should throw if response parent ID does not match comment ID', () => {
      const wrongParentId = Identifier.create(999);
      const responseForWrongParent = CommentResponse.create(
        {
          content: CommentContent.create('Wrong parent.'),
          userId: responseAuthorId,
          commentId: wrongParentId, // Belongs to comment 999
          postId: postId,
        },
        responseId,
      );

      expect(() => comment.addResponse(responseForWrongParent)).toThrow(
        InvalidCommentOperationException,
      );
      expect(() => comment.addResponse(responseForWrongParent)).toThrow(
        'Cannot add response to the wrong parent comment.',
      );
    });

    it('should not add the same response instance twice', () => {
      comment.addResponse(response); // Add first time
      comment.addResponse(response); // Add second time
      expect(comment.responses).toHaveLength(1); // Should still only have one
    });
  });

  describe('removeResponse() Method', () => {
    let comment: Comment;
    let response1: CommentResponse;
    let response2: CommentResponse;
    let responseId1: Identifier;
    let responseId2: Identifier;

    beforeEach(() => {
      comment = Comment.create(validCommentProps, Identifier.create(1));
      responseId1 = Identifier.create(201);
      responseId2 = Identifier.create(202);
      response1 = CommentResponse.create(
        {
          content: CommentContent.create('Reply 1'),
          userId: responseAuthorId,
          commentId: comment.id,
          postId: postId,
        },
        responseId1,
      );
      response2 = CommentResponse.create(
        {
          content: CommentContent.create('Reply 2'),
          userId: authorId,
          commentId: comment.id,
          postId: postId,
        },
        responseId2,
      );
      comment.addResponse(response1);
      comment.addResponse(response2);
      comment.clearEvents(); // Clear events after setup
      // Assuming addResponse doesn't add events now
    });

    it('should remove an existing response by ID', () => {
      expect(comment.responses).toHaveLength(2);
      comment.removeResponse(responseId1);
      expect(comment.responses).toHaveLength(1);
      expect(comment.responses[0].id.equals(responseId2)).toBe(true);
      // If managing updatedAt in domain: expect(comment.updatedAt > initialUpdatedAt).toBe(true);
      // Check for event if removeResponse adds one
    });

    it('should do nothing if response ID to remove does not exist', () => {
      const nonExistentId = Identifier.create(999);
      const initialResponses = [...comment.responses]; // Copy array
      // const initialUpdatedAt = comment.updatedAt;

      comment.removeResponse(nonExistentId);

      expect(comment.responses).toHaveLength(2);
      expect(comment.responses).toEqual(initialResponses); // Array should be unchanged
      // expect(comment.updatedAt).toEqual(initialUpdatedAt);
      expect(comment.domainEvents.length).toBe(0);
    });

    // it('should throw if response ID is null', () => {
    //   expect(() =>
    //     comment.removeResponse(null as unknown as Identifier),
    //   ).toThrow(ArgumentNotProvidedException);
    // });
  });
});
