import { beforeEach, describe, expect, it } from 'vitest';
import { PostMapper } from './post.mapper';
import { Post, PostProps } from '../../../domain/post/entities/post.entity';
import { Identifier } from '../../../domain/shared/identifier';
import { PostTitleVo } from '../../../domain/post/value-objects/post-title.vo';
import { PostContentVo } from '../../../domain/post/value-objects/post-content.vo';
import { PostOutputDto } from '../queries/get-post-by-id/get-post-by-id.dto';

describe('PostMapper', () => {
  let mapper: PostMapper;
  let postEntity: Post;
  const postId = Identifier.create(101);
  const authorId = Identifier.create(1);
  const categoryId1 = Identifier.create(10);
  const categoryId2 = Identifier.create(20);
  const now = new Date();

  beforeEach(() => {
    mapper = new PostMapper();
    const props: PostProps = {
      title: PostTitleVo.create('Post Title'),
      content: PostContentVo.create('Post Content'),
      published: true,
      userId: authorId,
      categoryIds: [categoryId1, categoryId2],
      created_at: now,
      updated_at: now,
    };
    postEntity = Post.create(props, postId);
  });

  it('should map Post entity to PostOutputDto', () => {
    const expectedDto: PostOutputDto = {
      id: postId.Value as number,
      title: 'Post Title',
      content: 'Post Content',
      published: true,
      authorId: authorId.Value as number,
      categoryIds: [categoryId1.Value, categoryId2.Value] as number[],
      created_at: now,
      updated_at: now,
    };

    const atualDto = mapper.toDto(postEntity);

    expect(atualDto).toBeInstanceOf(PostOutputDto);
    expect(atualDto).toEqual(expectedDto);
  });

  it('should handle null input for toDto', () => {
    expect(mapper.toDto(null)).toBeNull();
  });

  it('should map Post entity to PostOutputDto', () => {
    const postEntity2 = Post.create(
      {
        title: PostTitleVo.create('Another Post'),
        content: PostContentVo.create('More content.'),
        published: false,
        userId: authorId,
        categoryIds: [categoryId1],
        created_at: now,
        updated_at: now,
      },
      Identifier.create(102),
    );

    const entities = [postEntity, postEntity2];
    const dtos = mapper.toDtos(entities);

    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe(postId.Value);
    expect(dtos[1].id).toBe(102);
    expect(dtos[1].title).toBe('Another Post');
    expect(dtos[1].published).toBe(false);
    expect(dtos[1].categoryIds).toEqual([categoryId1.Value]);
  });

  it('should return an empty array for null/empty input array for toDtos', () => {
    expect(mapper.toDtos([])).toEqual([]);
    expect(mapper.toDtos(null as unknown as [])).toEqual([]);
  });
});
