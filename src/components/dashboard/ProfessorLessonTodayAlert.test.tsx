import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfessorLessonTodayAlert } from "@/components/dashboard/ProfessorLessonTodayAlert";

const licao = {
  id: 15,
  numero: 7,
  tema: "Uma aula importante",
  data: "2026-07-24",
  trimestre: 3,
  ano: 2026,
  turmaId: 9,
  turmaNome: "Adultos",
  registrada: false,
};

describe("ProfessorLessonTodayAlert", () => {
  it("destaca a aula de hoje e abre diretamente o registro", () => {
    const onOpen = vi.fn();
    render(
      <ProfessorLessonTodayAlert
        licao={licao}
        turmaNome="Adultos"
        onOpen={onOpen}
      />,
    );

    expect(screen.getByText("Hoje tem aula na sua turma!")).toBeInTheDocument();
    expect(
      screen.getByText("Registre a chamada, visitantes, Bíblias, revistas e oferta."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Abrir registro da lição 7 da turma Adultos",
      }),
    );
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("indica quando o registro da aula já foi iniciado", () => {
    render(
      <ProfessorLessonTodayAlert
        licao={{ ...licao, registrada: true }}
        turmaNome="Adultos"
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByText("Continuar registro")).toBeInTheDocument();
  });
});
