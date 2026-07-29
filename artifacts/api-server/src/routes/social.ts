import { Router, type IRouter, type Request, type Response } from 'express';
import {
  SearchUsersResponse,
  FollowUserResponse,
  UnfollowUserResponse,
  ListMyGroupsResponse,
  CreateGroupResponse,
  CreateGroupBody,
  JoinGroupResponse,
  JoinGroupBody,
  GetGroupLeaderboardResponse,
} from '@workspace/api-zod';
import {
  db,
  usersTable,
  followsTable,
  groupLeaguesTable,
  groupLeagueMembersTable,
} from '@workspace/db';
import { eq, and, or, ilike, ne } from 'drizzle-orm';
import crypto from 'crypto';

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): number | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'يجب تسجيل الدخول' });
    return null;
  }
  return parseInt(req.user.id, 10);
}

// GET /social/search?q=...
router.get('/social/search', async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    res.json(SearchUsersResponse.parse([]));
    return;
  }

  const meId = req.isAuthenticated() ? parseInt(req.user.id, 10) : null;

  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        or(
          ilike(usersTable.name, `%${q}%`),
          ilike(usersTable.username, `%${q}%`),
        ),
        meId ? ne(usersTable.id, meId) : undefined,
      ),
    )
    .limit(20);

  // Check which ones current user follows
  let followingSet = new Set<number>();
  if (meId) {
    const following = await db
      .select()
      .from(followsTable)
      .where(eq(followsTable.followerId, meId));
    followingSet = new Set(following.map((f) => f.followingId));
  }

  const results = users.map((u) => ({
    id: String(u.id),
    name: u.name,
    username: u.username,
    avatar: u.avatar,
    totalPoints: u.totalPoints,
    globalRank: u.globalRank,
    isFollowing: followingSet.has(u.id),
  }));

  res.json(SearchUsersResponse.parse(results));
});

// POST /social/friends/:userId — follow
router.post('/social/friends/:userId', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const targetId = parseInt(String(req.params['userId']), 10);
  if (isNaN(targetId) || targetId === meId) {
    res.status(400).json({ error: 'معرف مستخدم غير صالح' });
    return;
  }

  try {
    await db
      .insert(followsTable)
      .values({ followerId: meId, followingId: targetId })
      .onConflictDoNothing();

    res.json(FollowUserResponse.parse({ following: true, userId: String(targetId) }));
  } catch {
    res.status(500).json({ error: 'تعذّر المتابعة' });
  }
});

// DELETE /social/friends/:userId — unfollow
router.delete('/social/friends/:userId', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const targetId = parseInt(String(req.params['userId']), 10);
  if (isNaN(targetId)) {
    res.status(400).json({ error: 'معرف مستخدم غير صالح' });
    return;
  }

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.followerId, meId),
        eq(followsTable.followingId, targetId),
      ),
    );

  res.json(UnfollowUserResponse.parse({ following: false, userId: String(targetId) }));
});

// GET /social/groups — list my groups
router.get('/social/groups', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const memberships = await db
    .select()
    .from(groupLeagueMembersTable)
    .where(eq(groupLeagueMembersTable.userId, meId));

  const groupIds = memberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    res.json(ListMyGroupsResponse.parse([]));
    return;
  }

  const groups = await db
    .select()
    .from(groupLeaguesTable)
    .where(
      groupIds.length === 1
        ? eq(groupLeaguesTable.id, groupIds[0])
        : // For multiple groups, use a simple approach
          eq(groupLeaguesTable.id, groupIds[0]),
    );

  // Get member counts
  const result = await Promise.all(
    groupIds.map(async (gid) => {
      const [group] = await db
        .select()
        .from(groupLeaguesTable)
        .where(eq(groupLeaguesTable.id, gid));
      if (!group) return null;
      const members = await db
        .select()
        .from(groupLeagueMembersTable)
        .where(eq(groupLeagueMembersTable.groupId, gid));
      return {
        id: String(group.id),
        name: group.name,
        inviteCode: group.inviteCode,
        memberCount: members.length,
        createdAt: group.createdAt.toISOString(),
      };
    }),
  );

  res.json(ListMyGroupsResponse.parse(result.filter(Boolean)));
});

// POST /social/groups — create group
router.post('/social/groups', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  const [group] = await db
    .insert(groupLeaguesTable)
    .values({
      name: parsed.data.name,
      inviteCode,
      creatorId: meId,
    })
    .returning();

  // Auto-join creator
  await db
    .insert(groupLeagueMembersTable)
    .values({ groupId: group.id, userId: meId })
    .onConflictDoNothing();

  res.status(201).json(
    CreateGroupResponse.parse({
      id: String(group.id),
      name: group.name,
      inviteCode: group.inviteCode,
      memberCount: 1,
      createdAt: group.createdAt.toISOString(),
    }),
  );
});

// POST /social/groups/join — join by invite code
router.post('/social/groups/join', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'رمز دعوة مطلوب' });
    return;
  }

  const [group] = await db
    .select()
    .from(groupLeaguesTable)
    .where(eq(groupLeaguesTable.inviteCode, parsed.data.inviteCode.toUpperCase()));

  if (!group) {
    res.status(400).json({ error: 'رمز الدعوة غير صالح' });
    return;
  }

  await db
    .insert(groupLeagueMembersTable)
    .values({ groupId: group.id, userId: meId })
    .onConflictDoNothing();

  const members = await db
    .select()
    .from(groupLeagueMembersTable)
    .where(eq(groupLeagueMembersTable.groupId, group.id));

  res.json(
    JoinGroupResponse.parse({
      id: String(group.id),
      name: group.name,
      inviteCode: group.inviteCode,
      memberCount: members.length,
      createdAt: group.createdAt.toISOString(),
    }),
  );
});

// GET /social/groups/:id — group leaderboard
router.get('/social/groups/:id', async (req: Request, res: Response): Promise<void> => {
  const meId = requireAuth(req, res);
  if (!meId) return;

  const groupId = parseInt(String(req.params['id']), 10);
  if (isNaN(groupId)) {
    res.status(400).json({ error: 'معرف غير صالح' });
    return;
  }

  const [group] = await db
    .select()
    .from(groupLeaguesTable)
    .where(eq(groupLeaguesTable.id, groupId));

  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const members = await db
    .select()
    .from(groupLeagueMembersTable)
    .where(eq(groupLeagueMembersTable.groupId, groupId));

  // Enforce membership: only group members can view the leaderboard
  const isMember = members.some((m) => m.userId === meId);
  if (!isMember) {
    res.status(403).json({ error: 'يجب أن تكون عضواً في المجموعة للاطلاع على ترتيبها' });
    return;
  }

  const memberUsers = await Promise.all(
    members.map(async (m) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, m.userId));
      return user;
    }),
  );

  const entries = memberUsers
    .filter(Boolean)
    .sort((a, b) => b!.totalPoints - a!.totalPoints)
    .map((u, i) => ({
      rank: i + 1,
      user: {
        id: String(u!.id),
        name: u!.name,
        avatar: u!.avatar,
        country: u!.country,
      },
      points: u!.totalPoints,
      predictions: u!.totalPredictions,
      accuracy: u!.accuracy,
      change: 0,
    }));

  res.json(
    GetGroupLeaderboardResponse.parse({
      id: String(group.id),
      name: group.name,
      inviteCode: group.inviteCode,
      memberCount: members.length,
      createdAt: group.createdAt.toISOString(),
      entries,
    }),
  );
});

export default router;
