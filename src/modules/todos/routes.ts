import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import {
  listTodosSchema,
  getTodoSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} from './schema.js';
import {
  listTodosHandler,
  getTodoHandler,
  createTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
} from './controller.js';

// Personal todos — authenticated by the standard JWT, not workspace-scoped.
// Full CRUD: list, read one, create, update (title/completed), delete.
export async function todoRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  app.get('/', { schema: listTodosSchema, preHandler: auth }, listTodosHandler);
  app.post('/', { schema: createTodoSchema, preHandler: auth }, createTodoHandler);
  app.get('/:todoId', { schema: getTodoSchema, preHandler: auth }, getTodoHandler);
  app.patch('/:todoId', { schema: updateTodoSchema, preHandler: auth }, updateTodoHandler);
  app.delete('/:todoId', { schema: deleteTodoSchema, preHandler: auth }, deleteTodoHandler);
}
