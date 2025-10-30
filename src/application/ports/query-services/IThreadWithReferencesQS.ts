import { ThreadWithReferencesDTO } from './dtos/ThreadWithReferencesDTO';

export interface IThreadWithReferencesQS {
  getThreadWithReferences(threadID: string): Promise<ThreadWithReferencesDTO | null>;
}
