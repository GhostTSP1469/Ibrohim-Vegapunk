import type { PrismaClient, Todo } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import type { CreateTodoBody, UpdateTodoBody } from './schema.js';

// Todos are personal: every query is scoped to the owning user. The service is
// the single source of truth for that ownership check (CLAUDE.md: never
// authorize only at the route).

export async function listTodos(prisma: PrismaClient, userId: string): Promise<Todo[]> {
  return prisma.todo.findMany({
    where: { user_id: userId },
    orderBy: [{ completed: 'asc' }, { created_at: 'desc' }],
  });
}

export async function getTodo(
  prisma: PrismaClient,
  userId: string,
  todoId: string,
): Promise<Todo> {
  const todo = await prisma.todo.findFirst({ where: { id: todoId, user_id: userId } });
  if (!todo) throw AppError.notFound('Todo not found');
  return todo;
}

export async function createTodo(
  prisma: PrismaClient,
  userId: string,
  body: CreateTodoBody,
): Promise<Todo> {
  return prisma.todo.create({
    data: { user_id: userId, title: body.title.trim() },
  });
}

export async function updateTodo(
  prisma: PrismaClient,
  userId: string,
  todoId: string,
  body: UpdateTodoBody,
): Promise<Todo> {
  const todo = await prisma.todo.findFirst({ where: { id: todoId, user_id: userId } });
  if (!todo) throw AppError.notFound('Todo not found');

  const data: { title?: string; completed?: boolean } = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.completed !== undefined) data.completed = body.completed;
  // Convenience: an empty body flips the completed flag (used by the checkbox).
  if (body.title === undefined && body.completed === undefined) {
    data.completed = !todo.completed;
  }

  return prisma.todo.update({ where: { id: todoId }, data });
}

export async function deleteTodo(
  prisma: PrismaClient,
  userId: string,
  todoId: string,
): Promise<void> {
  const todo = await prisma.todo.findFirst({ where: { id: todoId, user_id: userId } });
  if (!todo) throw AppError.notFound('Todo not found');
  await prisma.todo.delete({ where: { id: todoId } });
}
