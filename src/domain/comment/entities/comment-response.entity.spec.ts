import { beforeEach, describe, expect, it } from 'vitest';
import {
  CommentResponse,
  CommentResponseProps,
} from './comment-response.entity';
import { CommentContent } from '../value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';

describe('CommentResponse Entity', () => {
  let mininalValueProps: CommentResponseProps;

  beforeEach(() => {
    mininalValueProps = {
      content: CommentContent.create('This is a valid response comment.'),
      userId: Identifier.create(123),
      commentId: Identifier.create(456),
      postId: Identifier.create(789),
    };
  });

  it('should create a response comment', () => {
    const responseComment = CommentResponse.create(mininalValueProps);

    expect(responseComment).toBeInstanceOf(CommentResponse);
    expect(responseComment.id.Value).toBe(0);
    expect(responseComment.content).toBe(mininalValueProps.content);
    expect(responseComment.userId).toBe(mininalValueProps.userId);
    expect(responseComment.postId).toBe(mininalValueProps.postId);
    expect(responseComment._props.created_at).toBeInstanceOf(Date);
    expect(responseComment._props.updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when creating with invalid userId value (e.g., empty)', () => {
    const invalidProps = {
      ...mininalValueProps,
      userId: null as unknown as Identifier,
    };
    expect(() => CommentResponse.create(invalidProps)).toThrow(
      'Response author (userId) is required.',
    );
  });

  it('should throw an error when creating with invalid commentId value (e.g., empty)', () => {
    const invalidProps = {
      ...mininalValueProps,
      commentId: null as unknown as Identifier,
    };
    expect(() => CommentResponse.create(invalidProps)).toThrow(
      'Response parent comment ID (commentId) is required.',
    );
  });

  it('should throw an error when creating with invalid postId value (e.g., empty)', () => {
    const invalidProps = {
      ...mininalValueProps,
      postId: null as unknown as Identifier,
    };
    expect(() => CommentResponse.create(invalidProps)).toThrow(
      'Response post ID (postId) is required.',
    );
  });

  it('should update a response comment', () => {
    const responseComment = CommentResponse.create(mininalValueProps);
    const newContent = 'Updated response content.';
    responseComment.updateContent(newContent as unknown as CommentContent);

    expect(responseComment.content).toBe(newContent);
  });

  it('should throw an error when updating content to an invalid value (e.g., empty)', () => {
    const responseComment = CommentResponse.create(mininalValueProps);
    expect(() =>
      responseComment.updateContent('' as unknown as CommentContent),
    ).toThrow('Response content is required.');
  });
});
