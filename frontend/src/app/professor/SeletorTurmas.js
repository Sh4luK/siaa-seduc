"use client";

import styles from "./SeletorTurmas.module.css";

// Seleção de uma, várias ou todas as turmas/disciplinas do professor.
// turmasAgrupadas: [{ nomeTurma, opcoes: [{ id, disciplina_lecionada }] }]
// selecionadas: array de ids (AtravessaPor.id) em string
export default function SeletorTurmas({ turmasAgrupadas, selecionadas, onChange }) {
  const todosIds = turmasAgrupadas.flatMap((g) => g.opcoes.map((o) => String(o.id)));
  const marcadas = new Set(selecionadas);
  const todasMarcadas = todosIds.length > 0 && todosIds.every((id) => marcadas.has(id));

  function alternar(ids, marcar) {
    const proximo = new Set(marcadas);
    ids.forEach((id) => (marcar ? proximo.add(id) : proximo.delete(id)));
    onChange(todosIds.filter((id) => proximo.has(id)));
  }

  if (turmasAgrupadas.length === 0) {
    return <p className={styles.vazio}>Nenhuma turma vinculada a você.</p>;
  }

  return (
    <div className={styles.seletor}>
      <div className={styles.topo}>
        <label className={styles.marcarTodas}>
          <input
            type="checkbox"
            checked={todasMarcadas}
            onChange={(e) => alternar(todosIds, e.target.checked)}
          />
          Marcar todas as turmas
        </label>
        <span className={styles.contador}>
          {selecionadas.length} de {todosIds.length} selecionada(s)
        </span>
      </div>

      <div className={styles.lista}>
        {turmasAgrupadas.map((grupo) => {
          const idsGrupo = grupo.opcoes.map((o) => String(o.id));
          const qtdMarcadas = idsGrupo.filter((id) => marcadas.has(id)).length;
          const grupoMarcado = qtdMarcadas === idsGrupo.length;
          const variasDisciplinas = grupo.opcoes.length > 1;

          return (
            <div key={grupo.nomeTurma} className={styles.grupo}>
              <label className={styles.turma}>
                <input
                  type="checkbox"
                  checked={grupoMarcado}
                  ref={(el) => {
                    if (el) el.indeterminate = qtdMarcadas > 0 && !grupoMarcado;
                  }}
                  onChange={(e) => alternar(idsGrupo, e.target.checked)}
                />
                <span className={styles.nomeTurma}>{grupo.nomeTurma}</span>
                {!variasDisciplinas && (
                  <span className={styles.disciplinaUnica}>{grupo.opcoes[0].disciplina_lecionada}</span>
                )}
              </label>

              {variasDisciplinas && (
                <div className={styles.disciplinas}>
                  {grupo.opcoes.map((opcao) => (
                    <label key={opcao.id} className={styles.disciplina}>
                      <input
                        type="checkbox"
                        checked={marcadas.has(String(opcao.id))}
                        onChange={(e) => alternar([String(opcao.id)], e.target.checked)}
                      />
                      {opcao.disciplina_lecionada}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
