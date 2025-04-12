import { Identifier } from 'src/domain/shared/identifier';
import { Response as ResponseComment } from '../entities/response.entity';

export interface IResponseRepository {
  save(response: ResponseComment): Promise<ResponseComment>;
  update(response: ResponseComment): Promise<ResponseComment>;
  detResponses(): Promise<ResponseComment>;
  delete(id: Identifier): Promise<boolean>;
}
