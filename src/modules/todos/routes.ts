import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import {
  listTodosSchema,
  createTodoSchema,
  toggleTodoSchema,
  deleteTodoSchema,
} from './schema.js';
import {
  listTodosHandler,
  createTodoHandler,
  toggleTodoHandler,
  deleteTodoHandler,
} from './controller.js';

// Personal todos — authenticated by the standard JWT, not workspace-scoped.
export async function todoRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  app.get('/', { schema: listTodosSchema, preHandler: auth }, listTodosHandler);
  app.post('/', { schema: createTodoSchema, preHandler: auth }, createTodoHandler);
  app.patch('/:todoId', { schema: toggleTodoSchema, preHandler: auth }, toggleTodoHandler);
  app.delete('/:todoId', { schema: deleteTodoSchema, preHandler: auth }, deleteTodoHandler);
}
