// Integration tests: permission model + access-request / temporary-grant flow.
//
// Covers: a member may edit/delete their OWN issue but not others'; the four
// requestable capabilities are blocked for members (403 carries the capability);
// a member can raise a typed access request (dupes rejected); admins/owner see
// all requests while members see only their own; approving issues a 24h grant
// that unblocks the action; and role changes are owner-only.

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

const TS = Date.now();
const OWNER_EMAIL = `acc-owner-${TS}@example.com`;
const ALICE_EMAIL = `acc-alice-${TS}@example.com`;
const PW = 'Password123!';

let app: FastifyInstance;
let ownerToken: string;
let aliceToken: string;
let aliceId: string;
let workspaceSlug: string;
let projectId: string;
let stateId: string;
let aliceIssueId: string;
let ownerIssueId: string;

const auth = (t: string): [string, string] => ['Authorization', `Bearer ${t}`];
const ws = () => `/api/v1/workspaces/${workspaceSlug}`;
const proj = () => `${ws()}/projects/${projectId}`;
const access = () => `${ws()}/access-requests`;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();

  const reg = async (email: string): Promise<string> => {
    const res = await request(app.server)
      .post('/api/v1/auth/register')
      .send({ email, password: PW, display_name: email });
    return res.body.access_token as string;
  };
  ownerToken = await reg(OWNER_EMAIL);
  aliceToken = await reg(ALICE_EMAIL);
  const meRes = await request(app.server).get('/api/v1/auth/me').set(...auth(aliceToken));
  aliceId = meRes.body.id;

  workspaceSlug = `acc-ws-${TS}`;
  await request(app.server)
    .post('/api/v1/workspaces')
    .set(...auth(ownerToken))
    .send({ name: 'Access WS', slug: workspaceSlug });
  await request(app.server)
    .post(`${ws()}/members`)
    .set(...auth(ownerToken))
    .send({ user_id: aliceId, role: 'member' });

  const project = await request(app.server)
    .post(`${ws()}/projects`)
    .set(...auth(ownerToken))
    .send({ name: 'Access Project', identifier: 'ACC' });
  projectId = project.body.id;

  const states = await request(app.server).get(`${proj()}/states`).set(...auth(ownerToken));
  stateId = states.body[0].id;

  const ai = await request(app.server)
    .post(`${proj()}/issues`)
    .set(...auth(aliceToken))
    .send({ title: "Alice's issue", state_id: stateId });
  aliceIssueId = ai.body.id;

  const oi = await request(app.server)
    .post(`${proj()}/issues`)
    .set(...auth(ownerToken))
    .send({ title: "Owner's issue", state_id: stateId });
  ownerIssueId = oi.body.id;
});

afterAll(async () => {
  await app.prisma.workspace.deleteMany({ where: { slug: workspaceSlug } });
  await app.prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, ALICE_EMAIL] } } });
  await app.close();
});

describe('issue ownership enforcement', () => {
  it('lets a member edit their own issue', async () => {
    const res = await request(app.server)
      .patch(`${proj()}/issues/${aliceIssueId}`)
      .set(...auth(aliceToken))
      .send({ title: 'Alice edits her own' });
    expect(res.status).toBe(200);
  });

  it("blocks a member editing someone else's issue with capability detail", async () => {
    const res = await request(app.server)
      .patch(`${proj()}/issues/${ownerIssueId}`)
      .set(...auth(aliceToken))
      .send({ title: 'Alice tries to edit owner' });
    expect(res.status).toBe(403);
    expect(res.body.error.details.capability).toBe('edit_others_task');
  });

  it("blocks a member deleting someone else's issue", async () => {
    const res = await request(app.server)
      .delete(`${proj()}/issues/${ownerIssueId}`)
      .set(...auth(aliceToken));
    expect(res.status).toBe(403);
    expect(res.body.error.details.capability).toBe('delete_others_task');
  });
});

describe('restricted actions blocked for members', () => {
  it('blocks changing project settings', async () => {
    const res = await request(app.server)
      .patch(proj())
      .set(...auth(aliceToken))
      .send({ name: 'Renamed by member' });
    expect(res.status).toBe(403);
    expect(res.body.error.details.capability).toBe('change_project_settings');
  });

  it('blocks inviting a member', async () => {
    const res = await request(app.server)
      .post(`${ws()}/invites`)
      .set(...auth(aliceToken))
      .send({ email: 'someone@example.com', role: 'member' });
    expect(res.status).toBe(403);
    expect(res.body.error.details.capability).toBe('invite_member');
  });
});

describe('access-request lifecycle', () => {
  let requestId: string;

  it('lets a member raise a typed access request', async () => {
    const res = await request(app.server)
      .post(access())
      .set(...auth(aliceToken))
      .send({ capability: 'change_project_settings', project_id: projectId, target_label: 'Access Project' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.capability).toBe('change_project_settings');
    requestId = res.body.id;
  });

  it('rejects a duplicate pending request', async () => {
    const res = await request(app.server)
      .post(access())
      .set(...auth(aliceToken))
      .send({ capability: 'change_project_settings' });
    expect(res.status).toBe(409);
  });

  it('rejects an unknown capability', async () => {
    const res = await request(app.server)
      .post(access())
      .set(...auth(aliceToken))
      .send({ capability: 'delete_workspace' });
    expect(res.status).toBe(400);
  });

  it('shows the request to the owner and to the requester', async () => {
    const ownerList = await request(app.server).get(access()).set(...auth(ownerToken));
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.some((r: { id: string }) => r.id === requestId)).toBe(true);

    const aliceList = await request(app.server).get(access()).set(...auth(aliceToken));
    expect(aliceList.body.every((r: { requester_id: string }) => r.requester_id === aliceId)).toBe(true);
  });

  it('has no active grant before approval', async () => {
    const res = await request(app.server).get(`${access()}/grants`).set(...auth(aliceToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('forbids a member approving requests', async () => {
    const res = await request(app.server)
      .post(`${access()}/${requestId}/approve`)
      .set(...auth(aliceToken));
    expect(res.status).toBe(403);
  });

  it('lets the owner approve, issuing a grant', async () => {
    const res = await request(app.server)
      .post(`${access()}/${requestId}/approve`)
      .set(...auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');

    const grants = await request(app.server).get(`${access()}/grants`).set(...auth(aliceToken));
    expect(grants.body.some((g: { capability: string }) => g.capability === 'change_project_settings')).toBe(true);
  });

  it('now lets the member change project settings via the grant', async () => {
    const res = await request(app.server)
      .patch(proj())
      .set(...auth(aliceToken))
      .send({ name: 'Renamed with grant' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed with grant');
  });

  it('blocks re-requesting a capability the member already holds', async () => {
    const res = await request(app.server)
      .post(access())
      .set(...auth(aliceToken))
      .send({ capability: 'change_project_settings' });
    expect(res.status).toBe(400);
  });
});

describe('owner-only role management', () => {
  it('lets the owner change a member role, but not the member', async () => {
    const asMember = await request(app.server)
      .patch(`${ws()}/members/${aliceId}`)
      .set(...auth(aliceToken))
      .send({ role: 'admin' });
    expect(asMember.status).toBe(403);

    const asOwner = await request(app.server)
      .patch(`${ws()}/members/${aliceId}`)
      .set(...auth(ownerToken))
      .send({ role: 'admin' });
    expect(asOwner.status).toBe(200);
  });
});
