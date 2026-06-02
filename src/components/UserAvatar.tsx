import { useEffect, useState } from "react";
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
  const [imageFailed, setImageFailed] = useState(false);
  const fotoValida = Boolean(fotoUrl?.trim()) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [fotoUrl]);

  return (
    <Avatar className={className}>
      {fotoValida ? (
        <AvatarImage
          src={fotoUrl!.trim()}
          alt={nome}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <AvatarFallback className={cn("bg-primary text-primary-foreground font-semibold", fallbackClassName)}>
        {getIniciais(nome)}
      </AvatarFallback>
    </Avatar>
  );
}
