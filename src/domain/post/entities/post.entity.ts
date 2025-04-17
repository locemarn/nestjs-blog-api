import { PostTitleVo } from '../value-objects/post-title.vo';
import { PostContentVo } from '../value-objects/post-content.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { BaseEntity } from '../../shared/base-entity';
import { PostCreatedEvent } from '../events/post-created.event';
import {
  ArgumentNotProvidedException,
  CategoryAssociationException,
  PostContentMissingException,
  PostIsAlreadyPublishedException,
  PostIsNotPublishedException,
} from '../exceptions/post.exceptions';
import { PostPublishedEvent } from '../events/post-published.event';
import { PostUnpublishedEvent } from '../events/post-unpublished.event';
import { PostUpdatedEvent } from '../events/post-updated.event';

export interface PostProps {
  title: PostTitleVo;
  content: PostContentVo;
  published: boolean;
  userId: Identifier; // Reference User by ID
  categoryIds: Identifier[]; // Reference Categories by ID
  created_at: Date;
  updated_at: Date;
}

export class Post extends BaseEntity<PostProps> {
  private constructor(props: PostProps, id?: Identifier) {
    super(props, id);
  }

  // --- Getters ---
  get title(): PostTitleVo {
    return this._props.title;
  }

  get content(): PostContentVo {
    return this._props.content;
  }

  get isPublished(): boolean {
    return this._props.published;
  }

  get authorId(): Identifier {
    return this._props.userId;
  }

  get categoryIds(): Identifier[] {
    return [...this._props.categoryIds];
  } // Return copy

  get created_at(): Date {
    return this._props.created_at;
  }

  get updated_at(): Date {
    return this._props.updated_at;
  }

  public static create(props: PostProps, id?: Identifier): Post {
    this.validateProps(props);
    const now = new Date();
    const postProps: PostProps = {
      ...props,
      published: props.published ?? false,
      categoryIds: props.categoryIds ?? [],
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };

    const post = new Post(postProps, id);

    if (!id || id.Value === 0) {
      post.addDomainEvent(new PostCreatedEvent(post.id, post._props.userId));
    }

    return post;
  }

  // --- Validation ---
  private static validateProps(props: PostProps): void {
    if (!props.title)
      throw new ArgumentNotProvidedException('Post title is required');
  }

  // --- Business Methods ---
  public publish(): void {
    if (this.isPublished)
      throw new PostIsAlreadyPublishedException(this.id.Value);

    if (!this._props.content || this._props.content.Value.trim().length === 0)
      throw new PostContentMissingException();

    this._props.published = true;
    this.touch();
    this.addDomainEvent(new PostPublishedEvent(this.id));
  }

  public unpublish(): void {
    if (!this.isPublished) throw new PostIsNotPublishedException(this.id.Value);

    this._props.published = false;
    this.touch();
    this.addDomainEvent(new PostUnpublishedEvent(this.id));
  }

  public updateTitle(newTitle: PostTitleVo): void {
    if (!this._props.title.equals(newTitle)) {
      this._props.title = newTitle;
      this.touch();
      this.addDomainEvent(new PostUpdatedEvent(this.id, ['title']));
    }
  }

  public updateContent(newContent: PostContentVo): void {
    if (!this._props.content.equals(newContent)) {
      this._props.content = newContent;
      this.touch();
      this.addDomainEvent(new PostUpdatedEvent(this.id, ['content']));
    }
  }

  public addCategoty(categoryId: Identifier): void {
    if (!categoryId)
      throw new CategoryAssociationException(
        'Category ID cannot be null or undefined when adding.',
      );
    const hasCategory = this._props.categoryIds.some((id) =>
      id.equals(categoryId),
    );
    if (!hasCategory) {
      this._props.categoryIds.push(categoryId);
      this.touch();
      this.addDomainEvent(new PostUpdatedEvent(categoryId, ['categories']));
    }
  }

  public removeCategory(categoryId: Identifier): void {
    if (!categoryId) {
      throw new CategoryAssociationException(
        'Category ID cannot be null or undefined when removing.',
      );
    }
    const initialLength = this._props.categoryIds.length;
    this._props.categoryIds = this._props.categoryIds.filter(
      (id) => !id.equals(categoryId),
    );
    if (this._props.categoryIds.length < initialLength) {
      // If removal actually happened
      this.touch();
      this.addDomainEvent(new PostUpdatedEvent(this.id, ['categories']));
    }
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
