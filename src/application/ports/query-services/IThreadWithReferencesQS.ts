import { ThreadWithReferencesDTO } from './dtos/ThreadWithReferencesDTO';

export interface IThreadWithReferencesQS {
  getThreadWithReferences(threadID: string): Promise<ThreadWithReferencesDTO | null>;
}

export const THREAD_WITH_REF_QUERY_TOKEN = Symbol('ThreadWithReferencesQS');
