import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Comment, CommentProps } from './comment.entity';
import { Identifier } from 'src/domain/shared/identifier';

describe('Comment Entity', () => {
  let minimalValueProps: CommentProps;

  beforeEach(() => {
    minimalValueProps = {
      content: 'Test content, '.repeat(10),
      postId: Identifier.create(10),
      userId: Identifier.create(13),
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  it('shlould create a valid comment with minimal value props', () => {
    const comment = Comment.create(minimalValueProps);

    console.log('comment --->', comment);

    expect(comment).toBeInstanceOf(Comment);
  });

  it('should thrown an error if content is not provide', () => {
    expect(() =>
      Comment.create({
        ...minimalValueProps,
        content: null as unknown as string,
      }),
    ).toThrow('Comment content is required');
  });

  it('should thrown an error if content has less than 3 chars', () => {
    expect(() =>
      Comment.create({
        ...minimalValueProps,
        content: 'ab',
      }),
    ).toThrow('Comment content must be more than 3 chars');
  });

  it('should thrown an error when postId is not instance of a Identifier', () => {
    expect(() =>
      Comment.create({
        ...minimalValueProps,
        postId: null as unknown as Identifier,
      }),
    ).toThrow('Comment postId must be an identifier type');
  });

  it('should thrown an error when userId is not instance of a Identifier', () => {
    expect(() =>
      Comment.create({
        ...minimalValueProps,
        userId: null as unknown as Identifier,
      }),
    ).toThrow('Comment userId must be an identifier type');
  });

  it('should update content', () => {
    const comment = Comment.create(minimalValueProps);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    comment.updateContent('Updated Content '.repeat(30));

    expect(comment.content).not.toEqual(minimalValueProps.content);
    expect(comment.updated_at).not.toEqual(minimalValueProps.updated_at);
  });

  it('should thrown an error on update content when content is not provide', () => {
    const comment = Comment.create(minimalValueProps);
    expect(() => comment.updateContent(null as unknown as string)).toThrow(
      'Comment newContent must be provide',
    );
  });
});
