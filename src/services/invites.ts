// Invite codes: the only way to create an account.
//
// An admin issues a code (optionally limited by use count and expiry); a new
// learner redeems it during signup. Redemption and account creation happen in
// one transaction so a code cannot be spent twice by two simultaneous signups.

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export interface InviteView {
  id: string;
  code: string;
  label: string;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  revoked: boolean;
  /** False once used up, expired, or revoked. */
  usable: boolean;
  createdAt: string;
  redeemedBy: { username: string; name: string }[];
}

/**
 * Human-transcribable code: no vowels (so no accidental words), and no
 * 0/O/1/I/L, which people mistype when reading a code off a screen.
 */
const ALPHABET = "23456789BCDFGHJKMNPQRSTVWXYZ";

function generateCode(groups = 3, size = 4): string {
  const bytes = randomBytes(groups * size);
  let out = "";
  for (let i = 0; i < groups * size; i++) {
    if (i > 0 && i % size === 0) out += "-";
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function toView(invite: {
  id: string; code: string; label: string; maxUses: number; uses: number;
  expiresAt: Date | null; revoked: boolean; createdAt: Date;
  redeemedBy?: { username: string; name: string }[];
}): InviteView {
  return {
    id: invite.id,
    code: invite.code,
    label: invite.label,
    maxUses: invite.maxUses,
    uses: invite.uses,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    revoked: invite.revoked,
    usable: !invite.revoked && invite.uses < invite.maxUses &&
      (invite.expiresAt === null || invite.expiresAt > new Date()),
    createdAt: invite.createdAt.toISOString(),
    redeemedBy: invite.redeemedBy ?? [],
  };
}

export async function listInvites(): Promise<InviteView[]> {
  const invites = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { redeemedBy: { select: { username: true, name: true } } },
  });
  return invites.map(toView);
}

export async function createInvite(opts: {
  createdById: string;
  label?: string;
  maxUses?: number;
  expiresInDays?: number | null;
}): Promise<InviteView> {
  // Retry on the astronomically unlikely collision rather than 500ing.
  for (let attempt = 0; ; attempt++) {
    const code = generateCode();
    if (await prisma.inviteCode.findUnique({ where: { code } })) {
      if (attempt < 5) continue;
      throw new Error("Could not generate a unique invite code");
    }
    const invite = await prisma.inviteCode.create({
      data: {
        code,
        label: opts.label ?? "",
        maxUses: opts.maxUses ?? 1,
        expiresAt: opts.expiresInDays
          ? new Date(Date.now() + opts.expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        createdById: opts.createdById,
      },
      include: { redeemedBy: { select: { username: true, name: true } } },
    });
    return toView(invite);
  }
}

export async function setInviteRevoked(id: string, revoked: boolean): Promise<InviteView> {
  const invite = await prisma.inviteCode.update({
    where: { id },
    data: { revoked },
    include: { redeemedBy: { select: { username: true, name: true } } },
  });
  return toView(invite);
}

export class SignupError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Codes are stored uppercase; accept any casing and stray spaces on input. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function redeemInviteAndCreateUser(input: {
  code: string;
  username: string;
  name: string;
  password: string;
}) {
  const code = normalizeCode(input.code);
  const username = input.username.trim().toLowerCase();

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite) throw new SignupError("That invite code is not valid");
  if (invite.revoked) throw new SignupError("That invite code has been revoked");
  if (invite.expiresAt && invite.expiresAt <= new Date()) {
    throw new SignupError("That invite code has expired");
  }
  if (invite.uses >= invite.maxUses) throw new SignupError("That invite code has already been used");
  if (await prisma.user.findUnique({ where: { username } })) {
    throw new SignupError("That username is taken");
  }

  // Conditional update: the uses check is re-evaluated inside the write, so two
  // signups racing on the last remaining use cannot both succeed.
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.inviteCode.updateMany({
      where: { id: invite.id, revoked: false, uses: { lt: invite.maxUses } },
      data: { uses: { increment: 1 } },
    });
    if (claimed.count === 0) throw new SignupError("That invite code has already been used");

    return tx.user.create({
      data: {
        username,
        name: input.name.trim(),
        passwordHash: hashPassword(input.password),
        role: "learner",
        invitedById: invite.id,
      },
    });
  });
}
