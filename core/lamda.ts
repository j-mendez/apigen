import { config, prettier, prettierPlugins } from "../deps.ts";
import type { Schema } from "../types.ts";

const env = config();

const API_HOST = env.API_HOST ?? Deno.env.get("API_HOST");

/**
 * Import mock data.
 * @param {string} mockName
 * @returns {string} Lambda method
 */
const importMock = async (mockName: string): Promise<string> => {
  const { mock } = await import(
    "../mocks/" + mockName.replace("@import ", "") + ".ts"
  ).catch((e) => {
    console.error([e, "please create a mocks directory with your api mocks"]);
    return { mock: null };
  });

  return mock ? JSON.stringify(mock) : "null";
};

/**
 * Generates lambda api route for production and development.
 * @param {Schema} schema
 * @returns {string} Lambda method
 */
const lambdaGenerator = async ({ method, url, mock }: Schema) => {
  const shouldMock = mock && API_HOST === "localhost";
  const genBody = async (): Promise<string> => {
    let errorBody = "";

    if (shouldMock) {
      const isMockImport =
        mock && typeof mock.data === "string" && mock.data.includes("@import");

      const mockData = isMockImport
        ? await importMock(mock.data + "")
        : JSON.stringify(mock.data ?? "null");

      errorBody = `response = {${`data: ${mockData}`}};`;
    } else {
      errorBody =
        `
      try {
         const auth = req.headers['authorization'] ?? res.getHeader('authorization');

         const headers = new Headers();

         headers.append('Content-Type', 'application/json');
         headers.append('Access-Control-Allow-Origin', host + '');
         headers.append('Access-Control-Allow-Credentials', 'true');

         if(auth) {
           headers.append('Authorization', auth + '');
         }
         let paramMap = '';
         
         if (req?.query) {
          let queryIndex = 0;
          for (const [key, value] of Object.entries(req.query)) {
            if(queryIndex === 0) {
              paramMap = ` +
        "`${paramMap}?${key}=${value}`" +
        `
            } else {
              paramMap = ` +
        "`${paramMap}&${key}=${value}`" +
        `
            }
            queryIndex++;
          }
         }
         
         const data = await fetch(` +
        "`${host}/${endpoint}${paramMap}`" +
        `, {
              method,
              body: body ? JSON.stringify(body) : undefined,
              credentials: 'same-origin',
              headers,
          });

          status = data.status;
          statusText = data.statusText;

          if ([200, 400, 401, 405, 500].includes(data.status)) {
              response = await data.json();
              jwt = data.headers.get('Authorization');
          }

      } catch (e) {
          console.error(e);
      }
    `;
    }

    return `
      if (!errors?.length) {
        ${errorBody}
      }
  `;
  };

  const genValidators = (): string => {
    const { validator } = mock;
    let validatorInsert = "";

    if (validator) {
      for (const field of validator?.fields) {
        validatorInsert =
          validatorInsert +
          `
          if (!body?.${field.name}) {
            ${field.status ? `status = ${field.status};` : ""};
            errors.push("${field.message}");
          }
        `;
      }
    }

    return validatorInsert;
  };

  const genInitVars = (): string => {
    return `
    ${
      shouldMock
        ? ""
        : `
    let endpoint = '${url}';      
    let method = '${method ?? "GET"}';`
    }
    let jwt${shouldMock && mock.jwt ? `= "Bearer @Auth_User"` : ""};
    let response: any;
    let errors: string[] = [];
    let status = 200;
    let statusText: string;`;
  };

  /**
   * Generates deno lambda api route
   * @returns {string} Deno Lambda method
   */
  const denoLambda = async () => `
  import { ServerRequest } from 'https://deno.land/std@0.84.0/http/server.ts';
  import { readAll } from 'https://deno.land/std/io/util.ts';

  ${
    shouldMock
      ? ""
      : `import { config } from "https://deno.land/x/dotenv/mod.ts";

  const env = config();
  const host = env.API_HOST;`
  }
  
  export default async (req: ServerRequest) => {
      ${genInitVars()}
      let body;
  
      if (['POST', 'PUT'].includes(req.method)) {
          const bodyData = await readAll(req.body).catch((e) => console.error(e))

          if (bodyData && bodyData?.length) {
            ${shouldMock ? "" : "method = 'POST';"}
            body = JSON.parse(
              new TextDecoder().decode(bodyData)
            );
          }
      }

      ${genValidators()}  
      ${await genBody()}
  
      return await req.respond({
          status,
          body: JSON.stringify({
              data: response,
              timestamp: new Date().toISOString(),
              errors: errors.length ? errors : null,
          }),
          headers: new Headers({
              'content-type': 'application/json; charset=utf-8',
              'Authorization': jwt,
          }),
      });
  };`;

  /**
   * Generates node lambda api route
   * @returns {string} Node Lambda method
   */
  const nodeLambda = async () => `
  import { NextApiRequest, NextApiResponse } from 'next'
  
  ${
    shouldMock
      ? ""
      : `
  const host = process.env.API_HOST;`
  }
  
  export default async (req: NextApiRequest, res: NextApiResponse) => {
      ${genInitVars()}
      let body = req.body && JSON.parse(req.body);

      ${genValidators()}
      ${await genBody()}
      
      const bodyData = {
        ...response,
        data: response?.data,
        timestamp: new Date().toISOString(),
        errors: errors?.length ? errors : null
      };

      ${
        ["/login", "/register"].includes(url)
          ? `
      if (status === 200 && jwt) {
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('Authorization', jwt);
      }
      `
          : ""
      }
      
      return res.status(status).send(bodyData)
  };`;

  const lamda = !env.DENO_RUNTIME ? await nodeLambda() : await denoLambda();

  return prettier.format(lamda, {
    parser: "typescript",
    plugins: prettierPlugins,
  });
};

export { lambdaGenerator };
