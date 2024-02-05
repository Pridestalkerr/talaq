import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "@acme/env";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter, createTRPCContext, openApiDocument } from "@acme/api";
import { createOpenApiExpressMiddleware } from "trpc-openapi";
import asyncHandler from "express-async-handler";
import swagger from "swagger-ui-express";

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
  const app = express();
  app.use(
    cors({
      // The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'
      origin: [env.CLIENT_HOST, /http:\/\/localhost:\d{4}\/?.*$/],
      credentials: true,
    }),
  );

  const trpcEP = env.API_ENDPOINT + "/trpc";
  const restEP = env.API_ENDPOINT + "/rest";
  const swaggerEP = env.API_ENDPOINT + "/swagger";

  app.use(cookieParser());
  app.use(
    trpcEP,
    createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
    }),
  );
  app.use(
    restEP,
    asyncHandler(
      createOpenApiExpressMiddleware({
        router: appRouter,
        createContext: createTRPCContext,
      }),
    ),
  );

  app.use(swaggerEP, swagger.serve);
  app.get(swaggerEP, swagger.setup(openApiDocument(restEP)));

  const server = createServer(app);
  server.listen(env.API_PORT, () => {
    console.log(`Listening on port ${env.API_PORT}`);
    console.log(`TRPC at ${trpcEP}`);
    console.log(`REST at ${restEP}`);
    console.log(`Swagger at ${swaggerEP}`);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
