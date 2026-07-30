from app.models import AtravessaPor, Nota

pares_para_limpar = [
    (450, 440),
    (441, 451),
    (442, 452),
    (443, 453),
    (445, 455),
    (446, 456),
    (447, 457),
    (448, 458),
]

for manter_id, remover_id in pares_para_limpar:
    qtd_notas_remover = Nota.objects.filter(turma_id=remover_id).count()

    if qtd_notas_remover > 0:
        print(f"PARE: ID {remover_id} tem {qtd_notas_remover} nota(s) - NAO removido. Investigue manualmente.")
        continue

    AtravessaPor.objects.filter(id=remover_id).delete()
    print(f"Removido ID {remover_id}, mantido {manter_id}")

print("Limpeza concluida. IDs 439, 449, 444, 454 foram preservados intencionalmente.")