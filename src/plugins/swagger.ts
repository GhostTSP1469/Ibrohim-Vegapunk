// OpenAPI docs.
//
// Registers @fastify/swagger to build the OpenAPI document from each route's
// JSON schema, and @fastify/swagger-ui to serve interactive docs at `/docs`.
// Must be registered BEFORE the routes it should document. A bearer-auth scheme
// is declared up front so Phase 1 auth-protected routes can reference it.

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '../config/index.js';

async function swaggerPlugin(app: FastifyInstance): Promise<void> {
  // Absolute, environment-aware base URL so the "Try it out" calls in /docs hit
  // the actual deployed server (e.g. the Render URL) from anywhere — not a path
  // relative to wherever the docs page happens to be opened. Trailing slash is
  // stripped so we never produce a double slash before `/api/v1`.
  const baseUrl = `${config.PUBLIC_BASE_URL.replace(/\/+$/, '')}/api/v1`;

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Task Management API',
        description: 'Plane/Jira-inspired multi-tenant task management REST API.',
        version: '0.1.0',
      },
      servers: [{ url: baseUrl, description: 'API v1 base path' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
}

export default fp(swaggerPlugin, { name: 'swagger' });
