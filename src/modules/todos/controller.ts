import type { FastifyRequest, FastifyReply } from 'fastify';
import * as todoService from './service.js';
import { CreateTodoBodySchema } from './schema.js';

export async function listTodosHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const todos = await todoService.listTodos(request.server.prisma, request.userId);
  reply.send(todos);
}

export async function createTodoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = CreateTodoBodySchema.parse(request.body);
  const todo = await todoService.createTodo(request.server.prisma, request.userId, body);
  reply.code(201).send(todo);
}

export async function toggleTodoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { todoId } = request.params as { todoId: string };
  const todo = await todoService.toggleTodo(request.server.prisma, request.userId, todoId);
  reply.send(todo);
}

export async function deleteTodoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { todoId } = request.params as { todoId: string };
  await todoService.deleteTodo(request.server.prisma, request.userId, todoId);
  reply.code(204).send();
}
