import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, UsersRound } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useListTeamQuery } from '@/features/team/teamApi.js';
import TeamCard from '@/features/team/TeamCard.jsx';
import TeamFormDialog from '@/features/team/TeamFormDialog.jsx';
import { TEAM_ROLES, AVAILABILITIES } from '@/features/team/teamConstants.js';

export default function TeamPage() {
  const user = useSelector(selectAuthUser);
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useListTeamQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    availability: availabilityFilter || undefined,
  });

  const members = data?.data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            Editors, colorists, sound designers and other specialists.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add team member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input
          placeholder="Search name, email, or specialty"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {TEAM_ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
        >
          <option value="">Any availability</option>
          {AVAILABILITIES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={UsersRound}
          title="Couldn't load team"
          description={error?.data?.message || 'The server returned an error.'}
        />
      ) : members.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No team members yet"
          description="Add your first editor or specialist to start assigning projects and tracking payouts."
          action={
            canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Add team member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((m) => (
            <TeamCard key={m._id} member={m} />
          ))}
        </div>
      )}

      <TeamFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
