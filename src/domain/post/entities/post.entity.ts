import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';

export interface PostProps {
  title: string;
  content: string;
  published: boolean;
  userId: Identifier;
  created_at: Date;
  updated_at: Date;
}

export class Post extends BaseEntity<PostProps> {
  private constructor(props: PostProps, id?: Identifier) {
    super(props, id);
  }

  static create(props: PostProps, id?: Identifier): Post {
    this.validateProps(props);
    const now = new Date();
    const postprops: PostProps = {
      ...props,
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };

    const post = new Post(postprops, id);
    return post;
  }

  // --- Getters for safe access ---
  get title(): string {
    return this._props.title;
  }

  get content(): string {
    return this._props.content;
  }

  get published(): boolean {
    return this._props.published;
  }

  get userId(): Identifier {
    return this._props.userId;
  }

  get created_at(): Date {
    return this._props.created_at;
  }

  get updated_at(): Date {
    return this._props.updated_at;
  }

  // --- Business Logic Methods ---
  public updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length < 3)
      throw new ArgumentNotProvidedException('Title must be provide');

    if (newTitle.trim().length > 100)
      throw new ArgumentNotProvidedException('Title is too long');

    this._props.title = newTitle;
    this.touch();
  }

  public updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length < 3)
      throw new ArgumentNotProvidedException('Content must be provide');

    this._props.content = newContent;
    this.touch();
  }

  public setPublish(): void {
    this._props.published = true;
    this.touch();
  }

  public setUnpublish(): void {
    this._props.published = false;
    this.touch();
  }

  // --- Validation ---
  private static validateProps(props: PostProps): void {
    if (!props.title)
      throw new ArgumentNotProvidedException('Post title is required');

    if (props.title.length < 3)
      throw new ArgumentNotProvidedException('Post title is too short');

    if (props.title.length > 100)
      throw new ArgumentNotProvidedException('Post title is too long');

    if (!props.content)
      throw new ArgumentNotProvidedException('Post content is required');

    if (props.content.length < 3)
      throw new ArgumentNotProvidedException('Post content is too short');

    if (!props.userId)
      throw new ArgumentNotProvidedException('Post userId is required');

    if (!(props.userId instanceof Identifier))
      throw new ArgumentNotProvidedException(
        'Post userId must be an instance of Identifier',
      );
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
