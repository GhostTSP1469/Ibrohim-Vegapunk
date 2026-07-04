// Integration test: list a workspace member's project memberships in one call.

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

const TS = Date.now();
const OWNER = `mp-owner-${TS}@example.com`;
const ALICE = `mp-alice-${TS}@example.com`;
const PW = 'Password123!';

let app: FastifyInstance;
let ownerToken: string;
let aliceId: string;
let slug: string;
let projA: string;
let projB: string;

const auth = (t: string): [string, string] => ['Authorization', `Bearer ${t}`];
const ws = () => `/api/v1/workspaces/${slug}`;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();

  const reg = async (email: string): Promise<string> => {
    const r = await request(app.server).post('/api/v1/auth/register').send({ email, password: PW, display_name: email });
    return r.body.access_token as string;
  };
  ownerToken = await reg(OWNER);
  const aliceToken = await reg(ALICE);
  aliceId = (await request(app.server).get('/api/v1/auth/me').set(...auth(aliceToken))).body.id;

  slug = `mp-ws-${TS}`;
  await request(app.server).post('/api/v1/workspaces').set(...auth(ownerToken)).send({ name: 'MP', slug });
  await request(app.server).post(`${ws()}/members`).set(...auth(ownerToken)).send({ user_id: aliceId, role: 'member' });

  projA = (await request(app.server).post(`${ws()}/projects`).set(...auth(ownerToken)).send({ name: 'Alpha', identifier: 'ALP' })).body.id;
  projB = (await request(app.server).post(`${ws()}/projects`).set(...auth(ownerToken)).send({ name: 'Beta', identifier: 'BET' })).body.id;
});

afterAll(async () => {
  await app.prisma.workspace.deleteMany({ where: { slug } });
  await app.prisma.user.deleteMany({ where: { email: { in: [OWNER, ALICE] } } });
  await app.close();
});

describe("member's project memberships", () => {
  it('is empty before assignment', async () => {
    const res = await request(app.server).get(`${ws()}/members/${aliceId}/projects`).set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('reflects the projects the member was added to', async () => {
    await request(app.server).post(`${ws()}/projects/${projA}/members`).set(...auth(ownerToken)).send({ user_id: aliceId });
    await request(app.server).post(`${ws()}/projects/${projB}/members`).set(...auth(ownerToken)).send({ user_id: aliceId });

    const res = await request(app.server).get(`${ws()}/members/${aliceId}/projects`).set(...auth(ownerToken));
    expect(res.status).toBe(200);
    const ids = (res.body as { project_id: string }[]).map((p) => p.project_id).sort();
    expect(ids).toEqual([projA, projB].sort());
  });

  it('drops a project after removal', async () => {
    await request(app.server).delete(`${ws()}/projects/${projA}/members/${aliceId}`).set(...auth(ownerToken));
    const res = await request(app.server).get(`${ws()}/members/${aliceId}/projects`).set(...auth(ownerToken));
    expect((res.body as { project_id: string }[]).map((p) => p.project_id)).toEqual([projB]);
  });
});
