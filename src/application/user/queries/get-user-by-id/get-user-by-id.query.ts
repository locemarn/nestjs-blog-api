export class GetUserByIdQuery {
  constructor(
    // The ID of the user to retrieve. Type should match your domain Identifier's value type.
    public readonly userId: number,
  ) {}
}
