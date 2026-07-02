# Как привязать запросы (для фронта)

Все запросы к API уже написаны. Тебе НЕ нужно трогать axios, токены или пути —
просто импортируй нужный хук (zustand) и вызывай функции. Ниже — по каждому ресурсу.

## 0. Как это устроено (прочитай один раз)

- Базовый адрес API берётся из `.env` → `VITE_BASE_URL` (уже указывает на прод-бэк).
- **Токен подставляется сам.** После `login`/`register` токены сохраняются в
  localStorage, и каждый запрос автоматически шлёт `Authorization: Bearer <token>`.
  Если access-токен протух (401) — он сам обновляется через refresh. Тебе делать
  ничего не надо.
- Все запросы лежат в `src/pages/<Feature>/<Feature>Zustand.ts`.
- У каждого стора один и тот же набор состояния: **`loading`**, **`error`**,
  и массив данных (`workspaces`, `projects`, `issues`, ...).

**Общий шаблон использования в компоненте:**

```tsx
import { useEffect } from "react";
import { useWorkspaceStore } from "../pages/Workspace/WorkspaceZustand";

function MyComponent() {
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace } = useWorkspaceStore();

  useEffect(() => { fetchWorkspaces(); }, []);   // загрузить при монтировании

  return (
    <>
      {loading && <p>Загрузка…</p>}
      {error && <p>{error}</p>}
      {workspaces.map((w) => <div key={w.id}>{w.name}</div>)}
      <button onClick={() => createWorkspace({ name: "New", slug: "new" })}>Создать</button>
    </>
  );
}
```

> Правило: **сначала идут id-параметры** (workspaceSlug → projectId → issueId),
> **потом объект с данными**. Функции create/update/delete возвращают `true/false`
> (успех), а `get*` — объект или `null`.

---

## Auth — `useAuthStore` (`pages/Auth/AuthZustand.ts`)

```ts
const { user, loading, error, register, login, updateProfile, getMe, logout } = useAuthStore();

await register(email, password, displayName);   // POST /auth/register  → сохраняет токены
await login(email, password);                   // POST /auth/login     → сохраняет токены
await updateProfile({ display_name, avatar_url });// PATCH /auth/me
await getMe();                                   // GET  /auth/me        → кладёт в user
await logout();                                  // POST /auth/logout    → чистит токены
```

## Workspaces — `useWorkspaceStore` (`pages/Workspace/WorkspaceZustand.ts`)

```ts
const { workspaces, members, loading, error,
        fetchWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace,
        fetchMembers, addMember, updateMemberRole, removeMember } = useWorkspaceStore();

fetchWorkspaces();                                  // GET    /workspaces/
getWorkspace(slug);                                 // GET    /workspaces/:slug
createWorkspace({ name, slug });                    // POST   /workspaces/
updateWorkspace(slug, { name, slug });              // PATCH  /workspaces/:slug
deleteWorkspace(slug);                              // DELETE /workspaces/:slug
fetchMembers(slug);                                 // GET    /workspaces/:slug/members
addMember(slug, { user_id, role });                 // POST   /workspaces/:slug/members
updateMemberRole(slug, userId, role);               // PATCH  /workspaces/:slug/members/:userId
removeMember(slug, userId);                         // DELETE /workspaces/:slug/members/:userId
```

## Projects — `useProjectsStore` (`pages/Projects/ProjectsZustand.ts`)

```ts
const { projects, members, ...rest } = useProjectsStore();

fetchProjects(slug);                                // GET    /workspaces/:slug/projects/
getProject(slug, projectId);                        // GET    .../projects/:projectId
createProject(slug, { name, identifier, description?, lead_id? });   // POST
updateProject(slug, projectId, { name?, description?, lead_id?, is_archived? }); // PATCH
deleteProject(slug, projectId);                     // DELETE
fetchMembers(slug, projectId);                      // GET    .../projects/:projectId/members
addMember(slug, projectId, { user_id, role });      // POST
removeMember(slug, projectId, userId);              // DELETE
```

## States — `useStatesStore` (`pages/States/StatesZustand.ts`)

```ts
const { states, ...rest } = useStatesStore();

fetchStates(slug, projectId);                                        // GET
createState(slug, projectId, { name, color, group, order?, is_default? }); // POST
updateState(slug, projectId, stateId, { name?, color?, group? });   // PATCH
deleteState(slug, projectId, stateId, transferToStateId?);          // DELETE
// group: "backlog" | "unstarted" | "started" | "completed" | "cancelled"
// ВАЖНО: если на статусе есть задачи — передай transferToStateId (id другого статуса),
// иначе бэкенд вернёт ошибку. UI-пример это делает автоматически.
```

## Labels — `useLabelsStore` (`pages/Labels/LabelsZustand.ts`)

```ts
const { labels, ...rest } = useLabelsStore();

fetchLabels(slug, projectId);                       // GET
createLabel(slug, projectId, { name, color });      // POST   color = "#RRGGBB"
updateLabel(slug, projectId, labelId, { name?, color? }); // PATCH
deleteLabel(slug, projectId, labelId);              // DELETE
```

## Issues — `useIssuesStore` (`pages/Issues/IssuesZustand.ts`)

```ts
const { issues, nextCursor, ...rest } = useIssuesStore();

fetchIssues(slug, projectId, params?);              // GET (params = фильтры/пагинация, опционально)
getIssue(slug, projectId, issueId);                 // GET .../:issueId
createIssue(slug, projectId, { title, state_id, priority?, description?, assignee_ids?, label_ids?, due_date? }); // POST
updateIssue(slug, projectId, issueId, { title?, state_id?, priority?, ... });  // PATCH
deleteIssue(slug, projectId, issueId);              // DELETE
addAssignee(slug, projectId, issueId, userId);      // POST   .../assignees
removeAssignee(slug, projectId, issueId, userId);   // DELETE .../assignees/:userId
addLabel(slug, projectId, issueId, labelId);        // POST   .../labels
removeLabel(slug, projectId, issueId, labelId);     // DELETE .../labels/:labelId
// title + state_id обязательны при создании. priority: none|low|medium|high|urgent
```

## Comments — `useCommentsStore` (`pages/Comments/CommentsZustand.ts`)

```ts
const { comments, ...rest } = useCommentsStore();

fetchComments(slug, projectId, issueId);            // GET
createComment(slug, projectId, issueId, { body, parent_comment_id? }); // POST
updateComment(slug, projectId, issueId, commentId, body);  // PATCH  (body — строка)
deleteComment(slug, projectId, issueId, commentId); // DELETE
```

## Cycles — `useCyclesStore` (`pages/Cycles/CyclesZustand.ts`)

```ts
const { cycles, ...rest } = useCyclesStore();

fetchCycles(slug, projectId);                       // GET
getCycle(slug, projectId, cycleId);                 // GET
createCycle(slug, projectId, { name, description?, start_date?, end_date? }); // POST
updateCycle(slug, projectId, cycleId, { name?, ... });  // PATCH
deleteCycle(slug, projectId, cycleId);              // DELETE
addIssues(slug, projectId, cycleId, [issueId, ...]);   // POST   .../issues
removeIssue(slug, projectId, cycleId, issueId);     // DELETE .../issues/:issueId
// ВАЖНО: даты — ISO datetime. Используй toIsoDate из "src/api" для <input type="date">.
```

## Modules — `useModulesStore` (`pages/Modules/ModulesZustand.ts`)

```ts
const { modules, ...rest } = useModulesStore();

fetchModules(slug, projectId);                      // GET
getModule(slug, projectId, moduleId);               // GET
createModule(slug, projectId, { name, description?, status?, lead_id?, start_date?, target_date? }); // POST
updateModule(slug, projectId, moduleId, { name?, ... }); // PATCH
deleteModule(slug, projectId, moduleId);            // DELETE
addIssues(slug, projectId, moduleId, [issueId, ...]);  // POST
removeIssue(slug, projectId, moduleId, issueId);    // DELETE
// status: backlog | in_progress | paused | completed | cancelled
```

## Issue Relations — `useIssueRelationsStore` (`pages/IssueRelations/IssueRelationsZustand.ts`)

```ts
const { relations, ...rest } = useIssueRelationsStore();

fetchRelations(slug, projectId, issueId);           // GET
createRelation(slug, projectId, issueId, { related_issue_id, relation_type }); // POST
deleteRelation(slug, projectId, issueId, linkId);   // DELETE
// relation_type: blocks | blocked_by | relates_to | duplicate | duplicate_of
```

## Activity — `useActivityStore` (`pages/Activity/ActivityZustand.ts`)

```ts
const { activity, loading, error, fetchActivity } = useActivityStore();
fetchActivity(slug, projectId, issueId);            // GET (только чтение)
```

## Attachments — `useAttachmentsStore` (`pages/Attachments/AttachmentsZustand.ts`)

```ts
const { attachments, ...rest } = useAttachmentsStore();

fetchAttachments(slug, projectId, issueId);         // GET
const res = await createAttachment(slug, projectId, issueId, { file_name, file_size, mime_type }); // POST
// res.upload.url — presigned-URL, куда PUT-ом заливаешь сами байты файла.
deleteAttachment(slug, projectId, attachmentId);    // DELETE (под /projects/, НЕ под /issues/)
```

## Notifications — `useNotificationsStore` (`pages/Notifications/NotificationsZustand.ts`)

```ts
const { notifications, ...rest } = useNotificationsStore();

fetchNotifications(slug);                            // GET
markAllRead(slug);                                  // POST /notifications/read-all
markRead(slug, notificationId);                     // POST /notifications/:id/read
```
