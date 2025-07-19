export interface ModelDB<T> {
  connection: unknown;

  getAll: (params: {
    page?: number;
    limit?: number;
  }) => Promise<T[] | null>;

  getName: (params: {
    name: string;
    page?: number;
    limit?: number;
  }) => Promise<T[] | null>;

  getById: (params: { id: string }) => Promise<T | null | undefined>;

  add: (params: { input: any }) => Promise<T>;

  update: (params: {
    id: string;
    input: Partial<T>;
  }) => Promise<T>;

  delete: (params: { id: string }) => Promise<boolean>;
}
