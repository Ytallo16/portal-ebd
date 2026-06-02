import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIniciais } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  nome: string;
  fotoUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({ nome, fotoUrl, className, fallbackClassName }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {fotoUrl ? <AvatarImage src={fotoUrl} alt={nome} /> : null}
      <AvatarFallback className={cn("bg-primary text-primary-foreground font-semibold", fallbackClassName)}>
        {getIniciais(nome)}
      </AvatarFallback>
    </Avatar>
  );
}
