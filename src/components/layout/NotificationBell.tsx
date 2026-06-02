import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookMarked,
  Cake,
  ClipboardList,
  CalendarClock,
} from "lucide-react";

import { NotificationListSkeleton } from "@/components/skeletons";
import { useNotifications } from "@/hooks/useNotifications";
import { usePermissions } from "@/auth/usePermissions";
import type { NotificationKind, PortalNotification } from "@/lib/portalApi";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const kindIcons: Record<NotificationKind, typeof Bell> = {
  ATTENDANCE_PENDING: ClipboardList,
  LESSON_TODAY: CalendarClock,
  LESSON_FINALIZE: ClipboardList,
  MAGAZINE_PAYMENT: BookMarked,
  BIRTHDAY_TODAY: Cake,
};

function formatRelativeTime(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} d`;
}

function NotificationItem({
  item,
  onOpen,
}: {
  item: PortalNotification;
  onOpen: (item: PortalNotification) => void;
}) {
  const Icon = kindIcons[item.kind] ?? Bell;
  return (
    <button
      type="button"
      className={cn(
        "flex w-full gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/60",
        !item.read && "bg-muted/30",
      )}
      onClick={() => onOpen(item)}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          item.severity === "warning" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {item.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
        ) : null}
        <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
      </div>
      {!item.read ? (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { podeCarregarOperacional } = usePermissions();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, isError, readOne, readAll, refresh } =
    useNotifications(podeCarregarOperacional);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) refresh();
  };

  const handleItemClick = (item: PortalNotification) => {
    if (!item.read) {
      readOne.mutate(item.id);
    }
    setOpen(false);
    if (item.actionPath) {
      navigate(item.actionPath);
    }
  };

  if (!podeCarregarOperacional) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target relative"
          aria-label={
            unreadCount > 0
              ? `Notificações, ${unreadCount} não lidas`
              : "Notificações"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-1.5rem),20rem)] max-h-[min(70dvh,24rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notificações</p>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>
        <div className="max-h-[min(60vh,320px)] overflow-y-auto p-1">
          {isLoading ? (
            <NotificationListSkeleton />
          ) : isError ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Não foi possível carregar as notificações.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova.
            </p>
          ) : (
            notifications.map((item) => (
              <NotificationItem key={item.id} item={item} onOpen={handleItemClick} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
