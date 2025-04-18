import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Type } from '@nestjs/common';
import { GetPostsQueryHandler } from './get-posts.handler';
import {
  FindPostQuery,
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { Identifier } from 'src/domain/shared/identifier';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { Post } from 'src/domain/post/entities/post.entity';
import { PostOutputDto } from '../get-post-by-id/get-post-by-id.dto';
import { Test } from '@nestjs/testing';
import { GetPostsQuery } from './get-posts.query';
import { GetPostsInputDto } from './get-posts.dto';

// --- Mocks ---
const mockPostRepository = {
  find: vi.fn(),
  count: vi.fn(),
};

const mockMapper = {
  toDto: vi.fn(),
  toDtos: vi.fn(),
};

describe('GetPostsHandler', () => {
  let handler: GetPostsQueryHandler;
  let repository: IPostRepository;
  let mapper: PostMapper;

  // Mock Data
  const date = new Date();
  const authorId1 = Identifier.create(1);
  // const catId1 = Identifier.create(10);
  const postProps1 = {
    title: PostTitleVo.create('Post 1'),
    content: PostContentVo.create('...'),
    userId: authorId1,
    published: true,
    categoryIds: [],
    created_at: date,
    updated_at: date,
  };
  const postEntity1 = Post.create(postProps1, Identifier.create(101));
  const postDto1: PostOutputDto = {
    id: 101,
    title: 'Post 1',
    content: '...',
    published: true,
    authorId: 1,
    categoryIds: [],
    created_at: date,
    updated_at: date,
  };

  const authorIs2 = Identifier.create(2);
  const catId2 = Identifier.create(20);
  const postProps2 = {
    title: PostTitleVo.create('Post 2'),
    content: PostContentVo.create('...'),
    userId: authorIs2,
    published: false,
    categoryIds: [catId2],
    created_at: date,
    updated_at: date,
  };
  const postEntity2 = Post.create(postProps2, Identifier.create(102));
  const postDto2: PostOutputDto = {
    id: 102,
    title: 'Post 2',
    content: '...',
    published: false,
    authorId: 2,
    categoryIds: [20],
    created_at: date,
    updated_at: date,
  };
  // End Mock Data

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetPostsQueryHandler,
        { provide: POST_MAPPER_TOKEN, useClass: PostMapper },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
      ],
    }).compile();

    handler = moduleRef.get<GetPostsQueryHandler>(
      GetPostsQueryHandler as Type<GetPostsQueryHandler>,
    );
    repository = moduleRef.get<IPostRepository>(POST_REPOSITORY_TOKEN);
    mapper = moduleRef.get<PostMapper>(POST_MAPPER_TOKEN);

    mockPostRepository.find.mockResolvedValue([postEntity1, postEntity2]);
    mockPostRepository.count.mockResolvedValue(5);
    mockMapper.toDtos.mockReturnValue([postDto1, postDto2]);
    mockMapper.toDto.mockReturnValue(postDto1);
  });

  it('should fetch posts with default options', async () => {
    const query = new GetPostsQuery();
    const mapperSpy = vi.spyOn(mapper, 'toDtos');

    const result = await handler.execute(query);

    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(repository.find).toHaveBeenCalledWith({
      published: undefined,
      authorId: undefined,
      categoryId: undefined,
      skip: 0,
      take: 10,
    });
    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(repository.count).toHaveBeenCalledWith({
      published: undefined,
      authorId: undefined,
      categoryId: undefined,
      skip: undefined,
      take: undefined,
    });

    expect(mapperSpy).toHaveBeenCalledWith([postEntity1, postEntity2]);

    expect(result.posts).toHaveLength(2);
    expect(result.posts[0]).toEqual(postDto1);
    expect(result.posts[1]).toEqual(postDto2);
    expect(result.total).toBe(5);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
  });

  it('should fetch posts with specific filter and pagination options', async () => {
    const options: GetPostsInputDto = {
      published: true,
      authorId: 1,
      categoryId: 10,
      skip: 5,
      take: 5,
    };
    const query = new GetPostsQuery(options);

    mockPostRepository.find.mockResolvedValue([postEntity1]);
    mockPostRepository.count.mockResolvedValue(1);

    const mapperSpy = vi.spyOn(mapper, 'toDtos');
    const result = await handler.execute(query);

    const expectedRepoQuery: FindPostQuery = {
      published: true,
      authorId: Identifier.create(1),
      categoryId: Identifier.create(10),
      skip: 5,
      take: 5,
    };

    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(repository.find).toHaveBeenCalledWith(expectedRepoQuery);
    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(repository.count).toHaveBeenCalledWith({
      published: true,
      authorId: Identifier.create(1),
      categoryId: Identifier.create(10),
      skip: undefined,
      take: undefined,
    });
    expect(mapperSpy).toHaveBeenCalledWith([postEntity1]);

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toEqual(postDto1);
    expect(result.total).toBe(1);
    expect(result.skip).toBe(5);
    expect(result.take).toBe(5);
    expect(result.hasMore).toBeTruthy();
  });

  it('should handle empty results correctly', async () => {
    const options: GetPostsInputDto = { published: false };
    const query = new GetPostsQuery(options);
    mockPostRepository.find.mockResolvedValue([]);
    mockPostRepository.count.mockResolvedValue(0);
    const mapperSpy = vi.spyOn(mapper, 'toDtos');

    const result = await handler.execute(query);

    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ published: false }),
    );
    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(repository.count).toHaveBeenCalledWith(
      expect.objectContaining({ published: false }),
    );

    expect(mapperSpy).toHaveBeenCalledWith([]);
    expect(result.posts).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
    expect(result.hasMore).toBeFalsy();
  });
});
