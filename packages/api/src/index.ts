import { generateOpenApiDocument } from "trpc-openapi";
import type { RouterInputs, RouterOutputs } from "./root";
export type { RouterInputs, RouterOutputs };
import type { AppRouter } from "./root";
export type { AppRouter };

import { appRouter } from "./root";
export { appRouter };
import { createTRPCContext } from "./trpc";
export { createTRPCContext };

export const openApiDocument = (baseUrl: string) => {
  // if you get a type error below, its likely due to the version of superjson, try 1.9.1
  return generateOpenApiDocument(appRouter, {
    title: "Talaq API",
    description: "OpenAPI compliant REST API built using tRPC with Express",
    version: "1.0.0",
    baseUrl,
    docsUrl: "https://github.com/jlalmes/trpc-openapi",
    securitySchemes: {
      //TODO: not sure if this works
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
      },
    },
    tags: ["talaq"],
  });
};
