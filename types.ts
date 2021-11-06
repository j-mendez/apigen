export type Field = { name: string; message?: string; status?: number };

export type Validator = {
  fields: Field[];
};

export type ApiShape = {
  data: any;
  message?: string;
  errors?: string[];
};

export interface DataMock {
  data: ApiShape | string;
  ["data:error"]: {
    message: string;
  };
  ["data:unready"]: {};
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

export interface CodegenOptions {
  apiBuildPath?: string;
  apiHost?: string;
  mocksPath?: string;
  schemasPath?: string;
}
