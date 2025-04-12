import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Post, PostProps } from './post.entity';
import { Identifier } from 'src/domain/shared/identifier';

describe('Post Entity', () => {
  let minimalValueProps: PostProps;

  beforeEach(() => {
    minimalValueProps = {
      title: 'Test Title',
      content: 'Test content'.repeat(30),
      published: true,
      userId: Identifier.create(10),
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  it('should create a post with a minima properties', () => {
    const post = Post.create(minimalValueProps);
    expect(post).toBeInstanceOf(Post);
  });

  it('should thrown an exception if title is not provide', () => {
    expect(() =>
      Post.create({ ...minimalValueProps, title: null as unknown as string }),
    ).toThrow('Post title is required');
  });

  it('should thrown an exception if title is string with less than 3 chars', () => {
    expect(() => Post.create({ ...minimalValueProps, title: 'ab' })).toThrow(
      'Post title is too short',
    );
  });

  it('should thrown an exception if title is string with more than 100 chars', () => {
    expect(() =>
      Post.create({ ...minimalValueProps, title: 'ab'.repeat(100) }),
    ).toThrow('Post title is too long');
  });

  it('should thrown an exception if content is not provide', () => {
    expect(() =>
      Post.create({ ...minimalValueProps, content: null as unknown as string }),
    ).toThrow('Post content is required');
  });

  it('should thrown an exception if content is string with less than 3 chars', () => {
    expect(() => Post.create({ ...minimalValueProps, content: 'ab' })).toThrow(
      'Post content is too short',
    );
  });

  it('should thrown an exception if userId is not provide', () => {
    expect(() =>
      Post.create({
        ...minimalValueProps,
        userId: null as unknown as Identifier,
      }),
    ).toThrow('Post userId is required');
  });

  it('should thrown an exception if userId is not instanceOf Identifier', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      Post.create({ ...minimalValueProps, userId: 2 as any }),
    ).toThrow('Post userId must be an instance of Identifier');
  });

  it('should update title', () => {
    const post = Post.create(minimalValueProps);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    post.updateTitle('Updated Title');

    expect(post.title).toBe('Updated Title');
    expect(post.updated_at).not.toEqual(minimalValueProps.updated_at);
  });

  it('should throw an error, when title is not provided or provided with less than 3 chars', () => {
    const post = Post.create(minimalValueProps);
    expect(() => post.updateTitle(null as unknown as string)).toThrow(
      'Title must be provide',
    );
    expect(() => post.updateTitle('')).toThrow('Title must be provide');

    expect(() => post.updateTitle('ab')).toThrow('Title must be provide');
  });

  it('should thrown an error with title has be more than 100 chars', () => {
    const post = Post.create(minimalValueProps);
    expect(() => post.updateTitle('ab'.repeat(100))).toThrow(
      'Title is too long',
    );
  });

  it('should update content', () => {
    const post = Post.create(minimalValueProps);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    post.updateContent('Updated Content'.repeat(10));

    expect(post.content).not.toEqual(minimalValueProps.content);
    expect(post.updated_at).not.toEqual(minimalValueProps.updated_at);
  });

  it('should throw an error, when content is not provided or provided with less than 3 chars', () => {
    const post = Post.create(minimalValueProps);
    expect(() => post.updateContent(null as unknown as string)).toThrow(
      'Content must be provide',
    );
    expect(() => post.updateContent('')).toThrow('Content must be provide');

    expect(() => post.updateContent('ab')).toThrow('Content must be provide');
  });

  it('should set post publish to true', () => {
    const post = Post.create({ ...minimalValueProps, published: false });
    expect(post.published).toBeFalsy();
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    post.setPublish();
    expect(post.published).toBeTruthy();
    expect(post.updated_at).not.toEqual(minimalValueProps.updated_at);
  });

  it('should set post unpublish to true', () => {
    const post = Post.create(minimalValueProps);
    expect(post.published).toBeTruthy();
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    post.setUnpublish();
    expect(post.published).toBeFalsy();
    expect(post.updated_at).not.toEqual(minimalValueProps.updated_at);
  });
});
