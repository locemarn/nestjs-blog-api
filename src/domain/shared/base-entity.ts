import { Identifier } from './identifier';

export abstract class BaseEntity<TProps> {
  protected readonly _id: Identifier;
  public readonly _props: TProps;

  protected constructor(props: TProps, id?: Identifier) {
    this._id = id ?? Identifier.create(0);
    this._props = props;
  }

  get id(): Identifier {
    return this._id;
  }

  public equals(object?: BaseEntity<TProps>): boolean {
    if (!object) return false;
    if (this === object) return true;
    if (!(object instanceof BaseEntity)) return false;
    return this._id.equals(object._id);
  }
}
