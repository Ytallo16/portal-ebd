import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatFaixaEtaria,
  type FaixaEtariaFormValue,
  validarFaixaEtaria,
} from "@/lib/faixaEtaria";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ label: string; value: FaixaEtariaFormValue }> = [
  {
    label: "Berçário",
    value: { modo: "idades", idadeMin: "0", idadeMax: "2", semIdadeMaxima: false, textoLivre: "" },
  },
  {
    label: "Primários",
    value: { modo: "idades", idadeMin: "6", idadeMax: "8", semIdadeMaxima: false, textoLivre: "" },
  },
  {
    label: "Adolescentes",
    value: { modo: "idades", idadeMin: "12", idadeMax: "17", semIdadeMaxima: false, textoLivre: "" },
  },
  {
    label: "Jovens",
    value: { modo: "idades", idadeMin: "18", idadeMax: "25", semIdadeMaxima: false, textoLivre: "" },
  },
  {
    label: "Adultos",
    value: { modo: "texto", idadeMin: "", idadeMax: "", semIdadeMaxima: false, textoLivre: "Adultos" },
  },
];

type FaixaEtariaFieldsProps = {
  value: FaixaEtariaFormValue;
  onChange: (value: FaixaEtariaFormValue) => void;
  className?: string;
  error?: string | null;
};

export function FaixaEtariaFields({ value, onChange, className, error }: FaixaEtariaFieldsProps) {
  const preview = formatFaixaEtaria(value);
  const validationError = error ?? validarFaixaEtaria(value);

  const patch = (partial: Partial<FaixaEtariaFormValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Faixa etária</Label>

      {value.modo === "idades" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">De</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            placeholder="6"
            className="w-20"
            value={value.idadeMin}
            onChange={(e) => patch({ idadeMin: e.target.value })}
            required={value.modo === "idades"}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            placeholder="12"
            className="w-20"
            value={value.idadeMax}
            disabled={value.semIdadeMaxima}
            onChange={(e) => patch({ idadeMax: e.target.value })}
            required={value.modo === "idades" && !value.semIdadeMaxima}
          />
          <span className="text-sm text-muted-foreground">anos</span>
        </div>
      ) : (
        <Input
          placeholder="Ex.: Adultos, Família"
          value={value.textoLivre}
          onChange={(e) => patch({ textoLivre: e.target.value })}
          required
        />
      )}

      {value.modo === "idades" && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="faixa-sem-max"
            checked={value.semIdadeMaxima}
            onCheckedChange={(checked) =>
              patch({
                semIdadeMaxima: checked === true,
                idadeMax: checked === true ? "" : value.idadeMax,
              })
            }
          />
          <Label htmlFor="faixa-sem-max" className="cursor-pointer text-sm font-normal">
            Sem idade máxima (ex.: 51 anos ou mais)
          </Label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="faixa-texto-livre"
          checked={value.modo === "texto"}
          onCheckedChange={(checked) =>
            patch({
              modo: checked === true ? "texto" : "idades",
            })
          }
        />
        <Label htmlFor="faixa-texto-livre" className="cursor-pointer text-sm font-normal">
          Descrição livre (sem idades numéricas)
        </Label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {preview ? (
        <p className="text-xs text-muted-foreground">
          Prévia: <span className="font-medium text-foreground">{preview}</span>
        </p>
      ) : null}

      {validationError ? (
        <p className="text-xs text-destructive">{validationError}</p>
      ) : null}
    </div>
  );
}
