type Field = { name: string; message?: string; status?: number };

type Validator = {
  fields: Field[];
};

type ApiShape = {
  data: any;
  message?: string;
  errors?: string[];
};

interface DataMock {
  data: ApiShape | string;
  ['data:error']: {
    message: string;
  };
  ['data:unready']: {};
  jwt?: boolean;
  validator?: Validator;
}

export type Schema = {
  method: string;
  url: string;
  path: string;
  mock: DataMock;
  deno?: boolean;
};
