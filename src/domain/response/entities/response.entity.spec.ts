import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Response as ResponseComment, ResponseProps } from './response.entity';
import { Identifier } from 'src/domain/shared/identifier';

describe('Response Entity', () => {
  let minimalValueProps: ResponseProps;

  beforeEach(() => {
    minimalValueProps = {
      content: 'Response comment '.repeat(10),
      userId: Identifier.create(10),
      commentId: Identifier.create(2),
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  it('should create a response for a existing comment', () => {
    const response = ResponseComment.create(minimalValueProps);
    expect(response).toBeInstanceOf(ResponseComment);
  });

  it('should thrown an error if miss content', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        content: null as unknown as string,
      }),
    ).toThrow('Response Comment content is required');
  });

  it('should thrown an error if content has less than 3 chars', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        content: 'aa',
      }),
    ).toThrow('Response Comment content is too short');
  });

  it('should thrown an error if miss userId', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        userId: null as unknown as Identifier,
      }),
    ).toThrow('Response Comment userId is required');
  });

  it('should thrown an error if userId has less than 3 chars', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        userId: 'aa' as unknown as Identifier,
      }),
    ).toThrow('Response Comment userId must be an instance of Identifier');
  });

  it('should thrown an error if miss commentId', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        commentId: null as unknown as Identifier,
      }),
    ).toThrow('Response Comment commentId is required');
  });

  it('should thrown an error if commentId has less than 3 chars', () => {
    expect(() =>
      ResponseComment.create({
        ...minimalValueProps,
        commentId: 'aa' as unknown as Identifier,
      }),
    ).toThrow('Response Comment commentId must be an instance of Identifier');
  });

  it('should update the content', () => {
    const responseComment = ResponseComment.create(minimalValueProps);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    responseComment.updateContent('Updated comment '.repeat(5));
    expect(responseComment.content).not.toEqual(minimalValueProps.content);
    expect(responseComment.updated_at).not.toEqual(
      minimalValueProps.updated_at,
    );
  });

  it('should thrown an error if miss the content or has less than 3 chars on update content', () => {
    const responseComment = ResponseComment.create(minimalValueProps);
    expect(() =>
      responseComment.updateContent(null as unknown as string),
    ).toThrow('Response Comment content is required');
    expect(() => responseComment.updateContent('ab')).toThrow(
      'Response Comment content is required',
    );
  });
});
