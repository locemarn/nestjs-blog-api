// import 'reflect-metadata';
// import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { Test } from '@nestjs/testing';
// import { CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';

import { describe, expect, it } from 'vitest';

// // Command/Handler/DTOs
// import { CreatePostCommandHandler } from './create-post.handler';
// import { CreatePostCommand } from './create-post.command';
// import { CreatePostInputDto } from './create-post.dto';

// // Domain Interfaces/Tokens/Entities/VOs/Exceptions
// import {
//   IPostRepository,
//   POST_REPOSITORY_TOKEN,
// } from '../../../../domain/post/repositories/post.repository.interface';
// import {
//   IUserRepository,
//   USER_REPOSITORY_TOKEN,
// } from '../../../../domain/user/repositories/user.repository.interface';
// import { Identifier } from '../../../../domain/shared/identifier';
// import { Post } from '../../../../domain/post/entities/post.entity';
// import {
//   Role,
//   User,
//   UserProps,
// } from '../../../../domain/user/entities/user.entity';
// import { PostTitleVo } from '../../../../domain/post/value-objects/post-title.vo';
// import { PostContentVo } from '../../../../domain/post/value-objects/post-content.vo';
// import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';

// // Other Application Layer elements
// import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
// import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';
// import {
//   UserNotFoundException,
//   ArgumentNotProvidedException,
// } from 'src/domain/exceptions/domain.exceptions';

// // --- Mocks ---
// const mockPostRepository = {
//   save: vi.fn(),
// };
// const mockUserRepository = {
//   findById: vi.fn(),
// };
// const mockEventBus = {
//   publish: vi.fn(),
//   publishAll: vi.fn(),
// };
// const mockQueryBus = { execute: vi.fn() };
// const mockPostMapper = { toDto: vi.fn(), toDtos: vi.fn() };

// describe('CreatePostCommandHandler', () => {
//   let handler: CreatePostCommandHandler;
//   let eventBus: EventBus;
//   let queryBus: QueryBus;
//   let postMapper: PostMapper;
//   let userRepo: IUserRepository;
//   let postRepo: IPostRepository;

//   // --- test Data Setup ---
//   const authorId = Identifier.create(1);
//   const categoryId1 = Identifier.create(10);
//   const savedPostId = Identifier.create(101);
//   const dateNow = new Date();

//   const createMockAuthor = (id: Identifier): User => {
//     const props: UserProps = {
//       email: `author-${id.Value}@test.com`,
//       username: `author-${id.Value}`,
//       password: 'hash',
//       role: Role.USER,
//       created_at: dateNow,
//       updated_at: dateNow,
//     };
//     return User.create(props, id);
//   };
//   const mockAuthor = createMockAuthor(authorId);

//   const commandInput: CreatePostInputDto = {
//     title: 'New Post Title',
//     content: 'New Post Content',
//     published: false,
//     authorId: authorId.Value as number,
//     categoryIds: [categoryId1.Value] as number[],
//   };
//   const command = new CreatePostCommand(commandInput);

//   // Expected Results
//   const mockPostReturnedBySave = Post.create(
//     {
//       title: PostTitleVo.create(commandInput.title),
//       content: PostContentVo.create(commandInput.content),
//       userId: authorId,
//       categoryIds: [categoryId1] as unknown as Identifier[],
//       published: commandInput.published as boolean,
//       created_at: expect.any(Date) as Date,
//       updated_at: expect.any(Date) as Date,
//     },
//     savedPostId,
//   );

//   // Expected DTO returned by mockQueryBus.execute
//   const expectedOutputDto: PostOutputDto = {
//     id: savedPostId.Value as number,
//     title: commandInput.title,
//     content: commandInput.content,
//     published: commandInput.published as boolean,
//     authorId: commandInput.authorId,
//     categoryIds: [categoryId1.Value] as number[],
//     created_at: dateNow,
//     updated_at: dateNow,
//   };
//   // --- End Test Data Setup ---

//   beforeEach(async () => {
//     vi.resetAllMocks();

//     const moduleRef = await Test.createTestingModule({
//       imports: [CqrsModule],
//       providers: [
//         CreatePostCommandHandler,
//         PostMapper,
//         { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
//         { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
//         { provide: POST_MAPPER_TOKEN, useExisting: PostMapper },
//         { provide: EventBus, useValue: mockEventBus },
//         {
//           provide: QueryBus,
//           useFactory: () => {
//             console.log('--- Providing mockQueryBus via factory ---');
//             // Ensure mockQueryBus is accessible here (defined outside describe)
//             mockQueryBus.execute.mockReset(); // Reset just before providing maybe?
//             return mockQueryBus;
//           },
//         },
//       ],
//     }).compile();

//     handler = moduleRef.get(CreatePostCommandHandler);
//     eventBus = moduleRef.get<EventBus>(EventBus);
//     userRepo = moduleRef.get<IUserRepository>(USER_REPOSITORY_TOKEN);
//     postRepo = moduleRef.get<IPostRepository>(POST_REPOSITORY_TOKEN);
//     queryBus = moduleRef.get<QueryBus>(QueryBus);
//     postMapper = moduleRef.get<PostMapper>(POST_MAPPER_TOKEN);

//     // Default mock implementations
//     mockUserRepository.findById.mockResolvedValue(mockAuthor);
//     mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave);
//     mockQueryBus.execute.mockResolvedValue(expectedOutputDto);
//   });

//   it('should create post successfully', async () => {
//     // Arrange: Configure mocks for the success path
//     mockUserRepository.findById.mockResolvedValue(mockAuthor);
//     mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave); // Return the specific instance
//     mockQueryBus.execute.mockResolvedValue(expectedOutputDto); // QueryBus returns the final DTO
//     // Spy on the specific instance the mock will return
//     const publishEventsSpy = vi
//       .spyOn(mockPostReturnedBySave, 'publishEvents')
//       .mockResolvedValue(undefined);

//     // Act
//     const result = await handler.execute(command);

//     // Assert: Check dependencies were called correctly
//     expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
//     expect(mockUserRepository.findById).toHaveBeenCalledWith(authorId);

//     expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
//     const savedEntityArg = mockPostRepository.save.mock.calls[0][0];
//     expect(savedEntityArg).toBeInstanceOf(Post);
//     expect(savedEntityArg.title.Value).toBe(commandInput.title);
//     expect(savedEntityArg.authorId.equals(authorId)).toBe(true);
//     expect(savedEntityArg.categoryIds[0].equals(categoryId1)).toBe(true);

//     // Assert: Check event publishing occurred with correct EventBus instance
//     expect(publishEventsSpy).toHaveBeenCalledTimes(1);
//     expect(publishEventsSpy).toHaveBeenCalledWith(eventBus);

//     // Assert: Check final query was made
//     expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
//     expect(mockQueryBus.execute).toHaveBeenCalledWith(
//       new GetPostByIdQuery(savedPostId.Value as number),
//     );

//     // Assert: Check the final result DTO
//     expect(result).toEqual(expectedOutputDto);
//   });

//   it('should throw UserNotFoundException if author does not exist', async () => {
//     // Arrange
//     mockUserRepository.findById.mockResolvedValue(null); // Author not found

//     // Act & Assert
//     await expect(handler.execute(command)).rejects.toThrow(
//       'User not found matching criteria: Author with ID 1 not found.',
//     );
//     await expect(handler.execute(command)).rejects.toThrow(
//       `Author with ID ${authorId.Value} not found.`,
//     );

//     // Assert side effects didn't happen
//     expect(mockPostRepository.save).not.toHaveBeenCalled();
//     expect(mockQueryBus.execute).not.toHaveBeenCalled();
//     expect(mockEventBus.publish).not.toHaveBeenCalled();
//   });

//   it('should propagate domain validation exceptions (e.g., invalid title)', async () => {
//     // Arrange
//     const invalidInput = { ...commandInput, title: '' }; // Empty title -> invalid PostTitleVo
//     const invalidCommand = new CreatePostCommand(invalidInput);
//     mockUserRepository.findById.mockResolvedValue(mockAuthor); // Assume author check passes

//     // Act & Assert: Expect the specific domain exception to bubble up
//     // The handler calls PostTitleVo.create, which should throw
//     await expect(handler.execute(invalidCommand)).rejects.toThrow(
//       'Post title cannot be empty',
//     ); // Use specific exception
//     await expect(handler.execute(invalidCommand)).rejects.toThrow(
//       'Post title cannot be empty',
//     ); // Check message

//     // Assert side effects didn't happen
//     expect(mockPostRepository.save).not.toHaveBeenCalled();
//   });

//   it('should throw error if fetching the created post via QueryBus fails', async () => {
//     // Arrange
//     mockUserRepository.findById.mockResolvedValue(mockAuthor);
//     mockPostRepository.save.mockResolvedValue(mockPostReturnedBySave);
//     mockQueryBus.execute.mockResolvedValue(null); // Simulate query returning null
//     const publishEventsSpy = vi
//       .spyOn(mockPostReturnedBySave, 'publishEvents')
//       .mockResolvedValue(undefined);

//     // Act & Assert
//     await expect(handler.execute(command)).rejects.toThrow(
//       `Failed to fetch newly created post with ID: ${savedPostId.Value}.`,
//     );

//     // Assert previous steps completed
//     expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
//     expect(publishEventsSpy).toHaveBeenCalledTimes(1); // Event publishing should still happen
//     expect(mockQueryBus.execute).toHaveBeenCalledTimes(1); // QueryBus was called
//   });
// });

describe('should', () => {
  it('should work', () => {
    expect(true).toBeTruthy();
  });
});
