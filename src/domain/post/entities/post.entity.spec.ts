import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Identifier } from 'src/domain/shared/identifier';
import { Post, PostProps } from './post.entity';
import { PostTitleVo } from '../value-objects/post-title.vo';
import { PostContentVo } from '../value-objects/post-content.vo';
import { PostCreatedEvent } from '../events/post-created.event';
import {
  ArgumentNotProvidedException,
  PostIsAlreadyPublishedException,
  PostIsNotPublishedException,
} from '../exceptions/post.exceptions';
import { PostUpdatedEvent } from '../events/post-updated.event';

describe('Post Entity', () => {
  let validProps: PostProps;
  const authorId = Identifier.create(1);
  const categoryId1 = Identifier.create(10);
  const categoryId2 = Identifier.create(20);

  beforeEach(() => {
    validProps = {
      title: PostTitleVo.create('Valid Title'),
      content: PostContentVo.create('Valid content here'),
      published: false,
      userId: authorId,
      categoryIds: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  it('should create a post instance with valid props', () => {
    const post = Post.create(validProps);

    expect(post).toBeInstanceOf(Post);
    expect(post.id.Value).toBe(0);
    expect(post.title.Value).toBe('Valid Title');
    expect(post.content.Value).toBe('Valid content here');
    expect(post.authorId.equals(authorId)).toBeTruthy();
    expect(post.isPublished).toBeFalsy();
    expect(post.categoryIds).toEqual([]);
    expect(post.domainEvents).toHaveLength(1);
    expect(post.domainEvents[0]).toBeInstanceOf(PostCreatedEvent);
  });

  it('should create a post with specific ID', () => {
    const postId = Identifier.create(123);
    const post = Post.create(validProps, postId);
    expect(post.id.equals(postId)).toBeTruthy();
    expect(post.domainEvents).toHaveLength(0);
  });

  it('should throw if title is not provided on create', () => {
    const invalidProps: PostProps = {
      ...validProps,
      title: null as unknown as PostTitleVo,
    };
    expect(() => Post.create(invalidProps)).toThrow(
      ArgumentNotProvidedException,
    );
  });

  describe('when published', () => {
    it('should published an unpublished post with content', () => {
      const post = Post.create(validProps);
      expect(post.isPublished).toBeFalsy();
      post.publish();
      expect(post.isPublished).toBeTruthy();
    });

    it('should throw when publishing an already published post', () => {
      const alreadyPublishedProps = {
        ...validProps,
        published: true,
      };
      const post = Post.create(alreadyPublishedProps, Identifier.create(1));
      expect(() => post.publish()).toThrow(PostIsAlreadyPublishedException);
    });
  });

  describe('when unpublished', () => {
    it('should unpublished a published post', () => {
      const alreadyPublishedProps = { ...validProps, published: true };
      const post = Post.create(alreadyPublishedProps);
      expect(post.isPublished).toBeTruthy();
      post.unpublish();
      expect(post.isPublished).toBeFalsy();
    });

    it('should not change state or add event if unpublishing an already unpublished post', () => {
      const post = Post.create(validProps, Identifier.create(1));
      const initialEventsCount = post.domainEvents.length;
      expect(post.isPublished).toBeFalsy();
      expect(post.domainEvents).toHaveLength(initialEventsCount);
      expect(() => post.unpublish()).toThrow(PostIsNotPublishedException);
      expect(post.isPublished).toBeFalsy();
      expect(post.domainEvents).toHaveLength(initialEventsCount);
    });
  });

  describe('Updating', () => {
    it('should update the title', () => {
      const post = Post.create(validProps, Identifier.create(1));
      const newTitle = PostTitleVo.create('Post updated title');
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.updateTitle(newTitle);
      expect(post.title.equals(newTitle)).toBeTruthy();
      expect(post._props.updated_at.getTime()).toBeGreaterThan(
        validProps.updated_at.getTime(),
      );
      expect(
        post.domainEvents.some((e) => e instanceof PostUpdatedEvent),
      ).toBeTruthy();
    });

    it('should update the content', () => {
      const post = Post.create(validProps, Identifier.create(1));
      const newContent = PostContentVo.create('Post updated content');
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.updateContent(newContent);
      expect(post.content.equals(newContent)).toBeTruthy();
      expect(post._props.updated_at.getTime()).toBeGreaterThan(
        validProps.updated_at.getTime(),
      );
      expect(
        post.domainEvents.some((e) => e instanceof PostUpdatedEvent),
      ).toBeTruthy();
    });

    it('should  not add update event if title/content is unchanged', () => {
      const post = Post.create(validProps, Identifier.create(1));
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.updateTitle(post.title);
      post.updateContent(post.content);
      expect(post.title.equals(post.title)).toBeTruthy();
      expect(post.content.equals(post.content)).toBeTruthy();
      expect(post.domainEvents).toHaveLength(0);
      expect(
        post.domainEvents.some((e) => e instanceof PostUpdatedEvent),
      ).toBeFalsy();
    });
  });

  describe('Category Management', () => {
    it('should add a category ID', () => {
      const post = Post.create(validProps, Identifier.create(1));
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.addCategoty(categoryId1);

      expect(post.categoryIds).toHaveLength(1);
      expect(post.categoryIds[0].equals(categoryId1)).toBeTruthy();
      expect(post._props.updated_at.getTime()).toBeGreaterThan(
        validProps.updated_at.getTime(),
      );
      expect(post.domainEvents).toHaveLength(1);
      expect(
        post.domainEvents.some((e) => e instanceof PostUpdatedEvent),
      ).toBeTruthy();
    });

    it('should not add a category ID twice', () => {
      const post = Post.create(validProps, Identifier.create(1));
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.addCategoty(categoryId1);
      const firstUpdateTime = post._props.updated_at.getTime();
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.addCategoty(categoryId1);

      expect(post.categoryIds).toHaveLength(1);
      expect(post._props.updated_at.getTime()).toEqual(firstUpdateTime);
    });

    it('should remove a category ID', () => {
      const post = Post.create(
        { ...validProps, categoryIds: [categoryId1, categoryId2] },
        Identifier.create(1),
      );
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      post.removeCategory(categoryId1);

      expect(post.categoryIds).toHaveLength(1);
      expect(post.categoryIds[0]).toBe(categoryId2);
      expect(post._props.updated_at.getTime()).toBeGreaterThan(
        post._props.created_at.getTime(),
      );
    });

    it('should not change state if removing a non-existent category ID', () => {
      const post = Post.create(validProps, Identifier.create(1));
      const nonExistenceCategory = Identifier.create(999);
      const initialUpdateTime = post._props.updated_at;
      post.removeCategory(nonExistenceCategory);

      expect(post.categoryIds).toHaveLength(0);
      expect(post._props.updated_at).toEqual(initialUpdateTime);
    });
  });
});
