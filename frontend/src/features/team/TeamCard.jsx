import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar.jsx';
import { Card, CardContent } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { TEAM_ROLE_BY_KEY, ROLE_BADGE_CLASS, AVAILABILITY_BY_KEY } from './teamConstants.js';
import { cn } from '@/lib/cn.js';

export default function TeamCard({ member }) {
  const role = TEAM_ROLE_BY_KEY[member.role];
  const av = AVAILABILITY_BY_KEY[member.availability];
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <Link to={`/team/${member._id}`} className="flex items-center gap-3">
          <Avatar name={member.name} src={member.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground hover:underline">
              {member.name}
            </div>
            {member.email && (
              <div className="truncate text-xs text-muted-foreground">{member.email}</div>
            )}
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          {role && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                ROLE_BADGE_CLASS[role.tone]
              )}
            >
              {role.label}
            </span>
          )}
          {av && <Badge variant={av.tone}>{av.label}</Badge>}
        </div>

        {member.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {member.specialties.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">
                {s}
              </Badge>
            ))}
            {member.specialties.length > 4 && (
              <Badge variant="muted" className="text-[10px]">
                +{member.specialties.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
          <div>
            <div className="text-muted-foreground">Active projects</div>
            <div className="text-base font-semibold text-foreground">
              {member.activeProjects ?? 0}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Delivered (mo)</div>
            <div className="text-base font-semibold text-foreground">
              {member.projectsCompletedThisMonth ?? 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
