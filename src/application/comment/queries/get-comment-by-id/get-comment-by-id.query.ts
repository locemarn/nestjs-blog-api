/**
 * Represents the query intent to fetch a single Comment (potentially with its replies)
 * based on its unique identifier.
 */
export class GetCommentByIdQuery {
  /**
   * @param commentId The primitive ID (number or string) of the comment to retrieve.
   * @param includeReplies Optional flag to indicate if nested replies should also be fetched. Defaults to true.
   *                       (The handler will need to pass this info to the repository if supported).
   */
  constructor(
    public readonly commentId: number,
    public readonly includeReplies: boolean = true,
  ) {}
}
