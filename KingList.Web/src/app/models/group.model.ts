export interface GroupMember {
  email: string;
  role: 'owner' | 'member';
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: Record<string, GroupMember>;
}
