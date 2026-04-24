import type {
  ProjectRole,
  ProjectTeamMember,
  ProjectTeamSaveMember,
} from '../projectProfile.types';

export type PlatformCollaboratorOption = {
  id: string;
  entityType: 'user' | 'company';
  name: string;
  email?: string;
  companyName?: string;
  avatarUrl?: string | null;
  subtitle?: string;
};

export type TeamEditorMember =
  | {
      id: string;
      memberType: 'user';
      memberId?: string | null;
      userId?: string | null;
      companyId?: null;
      name: string;
      role?: string | null;
      companyName?: string;
      avatarUrl?: string | null;
      permission?: ProjectRole | null;
      isPlatformMember: boolean;
      manualName?: string | null;
      manualOrganization?: string | null;
    }
  | {
      id: string;
      memberType: 'company';
      memberId?: string | null;
      companyId?: string | null;
      userId?: null;
      name: string;
      role?: string | null;
      companyName?: string;
      avatarUrl?: string | null;
      permission?: null;
      isPlatformMember: boolean;
      manualName?: string | null;
      manualOrganization?: string | null;
    };

export function normalizeTeamMember(member: ProjectTeamMember): TeamEditorMember | null {
  const isPlatformMember =
    typeof member.isPlatformMember === 'boolean'
      ? member.isPlatformMember
      : Boolean(member.userId ?? member.companyId ?? member.memberId);

  if (member.memberType === 'company') {
    const companyId = member.companyId ?? member.memberId ?? null;
    if (isPlatformMember && !companyId) return null;

    return {
      id: member.id ?? crypto.randomUUID(),
      memberType: 'company',
      memberId: companyId,
      companyId,
      userId: null,
      name:
        member.name ??
        member.companyName ??
        member.manualName ??
        member.manualOrganization ??
        '',
      role: member.role ?? '',
      companyName:
        member.companyName ??
        member.manualOrganization ??
        member.name ??
        '',
      avatarUrl: member.avatarUrl ?? null,
      permission: null,
      isPlatformMember,
      manualName: member.manualName ?? null,
      manualOrganization: member.manualOrganization ?? null,
    };
  }

  const userId = member.userId ?? member.memberId ?? null;
  if (isPlatformMember && !userId) return null;

  return {
    id: member.id ?? crypto.randomUUID(),
    memberType: 'user',
    memberId: userId,
    userId,
    companyId: null,
    name: member.name ?? member.manualName ?? '',
    role: member.role ?? '',
    companyName: member.companyName ?? member.manualOrganization ?? '',
    avatarUrl: member.avatarUrl ?? null,
    permission: member.permission ?? null,
    isPlatformMember,
    manualName: member.manualName ?? null,
    manualOrganization: member.manualOrganization ?? null,
  };
}

export function isUserEditorMember(
  member: TeamEditorMember
): member is Extract<TeamEditorMember, { memberType: 'user' }> {
  return member.memberType === 'user';
}

export function isCompanyEditorMember(
  member: TeamEditorMember
): member is Extract<TeamEditorMember, { memberType: 'company' }> {
  return member.memberType === 'company';
}

export function getEditorMemberDisplayName(member: TeamEditorMember): string {
  if (!member.isPlatformMember) {
    if (member.memberType === 'company') {
      return (
        member.manualOrganization?.trim() ||
        member.companyName?.trim() ||
        member.manualName?.trim() ||
        member.name?.trim() ||
        ''
      );
    }

    return member.manualName?.trim() || member.name?.trim() || '';
  }

  if (member.memberType === 'company') {
    return member.companyName?.trim() || member.name?.trim() || '';
  }

  return member.name?.trim() || '';
}

export function getEditorMemberSecondary(member: TeamEditorMember): string {
  const roleLabel = member.role?.trim();

  if (!member.isPlatformMember) {
    if (member.memberType === 'company') {
      return roleLabel || 'External company';
    }

    const org = member.manualOrganization?.trim() || member.companyName?.trim();
    return roleLabel ? (org ? `${roleLabel} · ${org}` : roleLabel) : org || 'External collaborator';
  }

  return roleLabel || member.companyName?.trim() || (member.memberType === 'company' ? 'Company' : 'Platform user');
}

export function toSaveTeamMember(member: TeamEditorMember): ProjectTeamSaveMember {
  if (isCompanyEditorMember(member)) {
    return {
      memberType: 'company',
      memberId: member.companyId ?? member.memberId ?? null,
      companyId: member.companyId ?? member.memberId ?? null,
      userId: null,
      name: member.name,
      companyName: member.companyName ?? member.name,
      avatarUrl: member.avatarUrl ?? null,
      role: member.role ?? null,
      permission: null,
      isPlatformMember: member.isPlatformMember,
      manualName: member.isPlatformMember ? null : (member.manualName ?? member.name ?? null),
      manualOrganization: member.isPlatformMember
        ? null
        : (member.manualOrganization ?? member.companyName ?? member.name ?? null),
    };
  }

  return {
    memberType: 'user',
    memberId: member.userId ?? member.memberId ?? null,
    userId: member.userId ?? member.memberId ?? null,
    companyId: null,
    name: member.name,
    companyName: member.companyName ?? '',
    avatarUrl: member.avatarUrl ?? null,
    role: member.role ?? null,
    permission: member.permission ?? null,
    isPlatformMember: member.isPlatformMember,
    manualName: member.isPlatformMember ? null : (member.manualName ?? member.name ?? null),
    manualOrganization: member.isPlatformMember
      ? null
      : (member.manualOrganization ?? member.companyName ?? null),
  };
}

export function dedupeTeamMembers(members: TeamEditorMember[]) {
  return Array.from(
    new Map(
      members.map((member) => {
        const key = member.isPlatformMember
          ? member.memberType === 'company'
            ? `company:${member.companyId ?? member.memberId}`
            : `user:${member.userId ?? member.memberId}`
          : `manual:${member.memberType}:${(member.name ?? '').trim().toLowerCase()}:${member.role ?? ''}`;

        return [key, member];
      })
    ).values()
  );
}