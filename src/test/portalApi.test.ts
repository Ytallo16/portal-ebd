import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginWithCredentials } from "@/lib/api";
import { fetchTurmas } from "@/lib/portalApi";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("portalApi integration mapping", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("login + fetchTurmas mapeia payload da API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: "token-access", refresh: "token-refresh" }))
      .mockResolvedValueOnce(
        jsonResponse({
          count: 1,
          results: [{ id: 1, nome: "Org 1" }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          count: 1,
          results: [
            {
              id: 10,
              nome: "Adultos I",
              faixa_etaria: "26-35",
              cor: "#125A94",
              total_alunos: 20,
              professores: [{ id: 1, user: 5, user_nome: "José Ferreira" }],
            },
          ],
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await loginWithCredentials("admin@adebd.com", "123456");
    const turmas = await fetchTurmas();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(turmas).toEqual([
      {
        id: "10",
        nome: "Adultos I",
        faixaEtaria: "26-35",
        professores: ["José Ferreira"],
        professorUsers: [{ id: 5, nome: "José Ferreira", linkId: "1" }],
        totalAlunos: 20,
        cor: "#125A94",
      },
    ]);
  });
});
