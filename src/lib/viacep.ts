import { extrairDigitosCep, formatarCep } from "@/lib/formatters";

export type EnderecoViaCep = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const digits = extrairDigitosCep(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    cep: formatarCep(data.cep ?? digits),
    rua: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf: data.uf ?? "",
  };
}
