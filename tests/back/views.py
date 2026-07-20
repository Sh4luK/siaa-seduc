"""
=====================================================================
TODOS OS CODIGOS UTILIZADOS ANTERIORMENTE EM `views.py` estão aqui. =
=====================================================================
"""

# @csrf_exempt
# def salvar_notas_turma(request):
#     """Salva as notas de vários alunos de uma turma de uma vez, para uma disciplina/professor específicos."""
#     if request.method != "POST":
#         return JsonResponse({"message": "Método não permitido."}, status=405)

#     try:
#         body = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"message": "JSON inválido."}, status=400)

#     turma_id = body.get("turma")
#     disciplina_id = body.get("disciplina")
#     professor_id = body.get("professor")
#     ano_letivo = body.get("ano_letivo", 2026)
#     lancamentos = body.get("lancamentos", [])

#     if not all([turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Campos 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     if not lancamentos:
#         return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

#     try:
#         turma = AtravessaPor.objects.get(id=turma_id)
#         disciplina = Disciplina.objects.get(id=disciplina_id)
#         professor = Professor.objects.get(id=professor_id)
#     except (AtravessaPor.DoesNotExist, Disciplina.DoesNotExist, Professor.DoesNotExist):
#         return JsonResponse({"message": "Turma, disciplina ou professor não encontrado."}, status=404)

#     campos_decimais = [
#         "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
#         "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
#         "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
#         "pf", "rcf",
#     ]

#     rf_valido = dict(Nota.RF_CHOICES)

#     resultado_por_aluno = []
#     erros_gerais = []

#     for lancamento in lancamentos:
#         aluno_id = lancamento.get("aluno_id")
#         campos = lancamento.get("notas", {})

#         if not aluno_id:
#             erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
#             continue

#         try:
#             aluno = Estudante.objects.get(id=aluno_id)
#         except Estudante.DoesNotExist:
#             erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
#             continue

#         nota, _ = Nota.objects.get_or_create(
#             aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
#         )

#         erros_aluno = []

#         for campo in campos_decimais:
#             if campo in campos:
#                 valor_bruto = campos[campo]
#                 if valor_bruto in (None, ""):
#                     setattr(nota, campo, None)
#                     continue
#                 try:
#                     valor = Decimal(str(valor_bruto))
#                 except InvalidOperation:
#                     erros_aluno.append(f"Valor inválido em {campo}: {valor_bruto}")
#                     continue
#                 if valor < 0 or valor > 10:
#                     erros_aluno.append(f"{campo} fora do intervalo (0-10): {valor}")
#                     continue
#                 setattr(nota, campo, valor)

#         if "tgf" in campos:
#             try:
#                 nota.tgf = int(campos["tgf"] or 0)
#             except (ValueError, TypeError):
#                 erros_aluno.append(f"Valor inválido para tgf: {campos['tgf']}")

#         if "rf" in campos:
#             if campos["rf"] in rf_valido:
#                 nota.rf = campos["rf"]
#             else:
#                 erros_aluno.append(f"RF inválido: {campos['rf']}")

#         nota.save()

#         resultado_por_aluno.append({
#             "aluno_id": aluno.id,
#             "nome_completo": aluno.nome_completo,
#             "erros": erros_aluno,
#             "notas": {
#                 "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
#                 "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
#                 "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
#                 "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
#                 "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
#                 "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
#                 "ma": float(nota.ma) if nota.ma is not None else None,
#                 "maf": float(nota.maf) if nota.maf is not None else None,
#             }
#         })

#     return JsonResponse({
#         "message": "Lançamentos processados.",
#         "erros_gerais": erros_gerais,
#         "resultado": resultado_por_aluno
#     })

# @csrf_exempt
# def get_notas_turma(request):
#     """Retorna todos os alunos de uma turma com suas notas (de uma disciplina/professor) já lançadas."""
#     turma_id = request.GET.get("turma")
#     disciplina_id = request.GET.get("disciplina")
#     professor_id = request.GET.get("professor")
#     ano_letivo = request.GET.get("ano_letivo", "2026")

#     if not all([turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Parâmetros 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
#     if not turma_obj:
#         return JsonResponse({"message": "Turma não encontrada."}, status=404)

#     turma_dict = model_to_dict(turma_obj)
#     nome_turma = turma_dict.get("turma") or ""

#     alunos = buscar_alunos_por_turma(nome_turma)

#     def campo(obj, nome):
#         if obj is None:
#             return None
#         valor = getattr(obj, nome)
#         return float(valor) if valor is not None else None

#     resultado = []

#     for aluno in alunos:
#         nota = Nota.objects.filter(
#             aluno=aluno,
#             turma_id=turma_id,
#             disciplina_id=disciplina_id,
#             professor_id=professor_id,
#             ano_letivo=ano_letivo,
#         ).first()

#         resultado.append({
#             "aluno_id": aluno.id,
#             "posicao_ordem": aluno.posicao_ordem,
#             "nome_completo": aluno.nome_completo,
#             "notas": {
#                 "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
#                 "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

#                 "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
#                 "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

#                 "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
#                 "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

#                 "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
#                 "rcf": campo(nota, "rcf"),
#                 "tgf": nota.tgf if nota else 0,
#                 "rf": nota.rf if nota else "CUR",
#             }
#         })

#     return JsonResponse({
#         "turma": nome_turma,
#         "total_alunos": len(resultado),
#         "alunos": resultado
#     })


# @csrf_exempt
# def salvar_notas(request):
#     """Cria ou atualiza as notas de um aluno para uma turma/disciplina/professor."""
#     if request.method != "POST":
#         return JsonResponse({"message": "Método não permitido."}, status=405)

#     try:
#         body = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"message": "JSON inválido."}, status=400)

#     aluno_id = body.get("aluno")
#     turma_id = body.get("turma")
#     disciplina_id = body.get("disciplina")
#     professor_id = body.get("professor")
#     ano_letivo = body.get("ano_letivo", 2026)
#     campos = body.get("notas", {})

#     if not all([aluno_id, turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Campos 'aluno', 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     try:
#         aluno = Estudante.objects.get(id=aluno_id)
#         turma = AtravessaPor.objects.get(id=turma_id)
#         disciplina = Disciplina.objects.get(id=disciplina_id)
#         professor = Professor.objects.get(id=professor_id)
#     except (Estudante.DoesNotExist, AtravessaPor.DoesNotExist,
#             Disciplina.DoesNotExist, Professor.DoesNotExist):
#         return JsonResponse({"message": "Aluno, turma, disciplina ou professor não encontrado."}, status=404)

#     nota, _ = Nota.objects.get_or_create(
#         aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
#     )

#     campos_decimais = [
#         "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
#         "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
#         "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
#         "pf", "rcf",
#     ]

#     erros = []
#     for campo in campos_decimais:
#         if campo in campos:
#             valor = _to_decimal(campos[campo])
#             if campos[campo] not in (None, "") and valor is None:
#                 erros.append(f"Valor inválido para {campo}: {campos[campo]}")
#                 continue
#             if valor is not None and (valor < 0 or valor > 10):
#                 erros.append(f"{campo} fora do intervalo (0-10): {valor}")
#                 continue
#             setattr(nota, campo, valor)

#     if "tgf" in campos:
#         try:
#             nota.tgf = int(campos["tgf"] or 0)
#         except (ValueError, TypeError):
#             erros.append(f"Valor inválido para tgf: {campos['tgf']}")

#     if "rf" in campos:
#         rf_valido = dict(Nota.RF_CHOICES)
#         if campos["rf"] in rf_valido:
#             nota.rf = campos["rf"]
#         else:
#             erros.append(f"RF inválido: {campos['rf']}")

#     nota.save()

#     return JsonResponse({
#         "message": "Notas salvas com sucesso.",
#         "erros": erros,
#         "notas": {
#             "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
#             "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
#             "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
#             "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
#             "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
#             "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
#             "ma": float(nota.ma) if nota.ma is not None else None,
#             "maf": float(nota.maf) if nota.maf is not None else None,
#         }
#     })

# correto
# def resolver_disciplina_da_turma(turma_obj):
#     nome_disciplina = (turma_obj.disciplina_lecionada or "").replace(" ", "").strip().lower()

#     if not nome_disciplina:
#         return None

#     print("Disciplina da turma:", turma_obj.disciplina_lecionada)

#     print("Disciplinas cadastradas:")
#     for d in Disciplina.objects.all():
#         print(f"[{d.id}] '{d.nome_disciplina}'")
    
#     return Disciplina.objects.annotate(
#         nome_normalizado=Replace("nome_disciplina", Value(" "), Value(""))
#     ).filter(nome_normalizado__iexact=nome_disciplina).first()



# @csrf_exempt
# def get_notas_aluno(request):
#     """Retorna as notas já lançadas de um aluno numa turma/disciplina/professor específicos."""
#     aluno_id = request.GET.get("aluno")
#     turma_id = request.GET.get("turma")
#     disciplina_id = request.GET.get("disciplina")
#     professor_id = request.GET.get("professor")
#     ano_letivo = request.GET.get("ano_letivo", "2026")

#     if not all([aluno_id, turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Parâmetros 'aluno', 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     try:
#         aluno = Estudante.objects.get(id=aluno_id)
#     except Estudante.DoesNotExist:
#         return JsonResponse({"message": "Aluno não encontrado."}, status=404)

#     nota = Nota.objects.filter(
#         aluno_id=aluno_id,
#         turma_id=turma_id,
#         disciplina_id=disciplina_id,
#         professor_id=professor_id,
#         ano_letivo=ano_letivo,
#     ).first()

#     def campo(obj, nome):
#         if obj is None:
#             return None
#         valor = getattr(obj, nome)
#         return float(valor) if valor is not None else None

#     dados = {
#         "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
#         "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

#         "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
#         "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

#         "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
#         "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

#         "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
#         "rcf": campo(nota, "rcf"),
#         "tgf": nota.tgf if nota else 0,
#         "rf": nota.rf if nota else "CUR",
#     }

#     return JsonResponse({
#         "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo},
#         "notas": dados,
#     })

# def _to_decimal(valor):
#     """Converte valor recebido em Decimal, retornando None se vazio/invalido."""
#     if valor is None or valor == "":
#         return None
#     try:
#         return Decimal(str(valor))
#     except InvalidOperation:
#         return None


# @csrf_exempt
# def get_notas_aluno(request):
#     aluno_id = request.GET.get("aluno")
#     turma_id = request.GET.get("turma")
#     disciplina_id = request.GET.get("disciplina")
#     ano_letivo = request.GET.get("ano_letivo", "2026")

#     if not all([aluno_id, turma_id, disciplina_id]):
#         return JsonResponse(
#             {"message": "Parâmetros 'aluno', 'turma' e 'disciplina' são obrigatórios."},
#             status=400
#         )

#     try:
#         aluno = Estudante.objects.get(id=aluno_id)
#     except Estudante.DoesNotExist:
#         return JsonResponse({"message": "Aluno não encontrado."}, status=404)

#     nota = Nota.objects.filter(
#         aluno_id=aluno_id,
#         turma_id=turma_id,
#         disciplina_id=disciplina_id,
#         ano_letivo=ano_letivo,
#     ).first()

#     def campo(obj, nome):
#         if obj is None:
#             return None
#         valor = getattr(obj, nome)
#         return float(valor) if valor is not None else None

#     dados = {
#         "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
#         "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

#         "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
#         "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

#         "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
#         "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

#         "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
#         "rcf": campo(nota, "rcf"),
#         "tgf": nota.tgf if nota else 0,
#         "rf": nota.rf if nota else "CUR",
#     }

#     return JsonResponse({
#         "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo},
#         "notas": dados,
#     })


# @csrf_exempt
# def salvar_notas(request):
#     if request.method != "POST":
#         return JsonResponse({"message": "Método não permitido."}, status=405)

#     try:
#         body = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"message": "JSON inválido."}, status=400)

#     aluno_id = body.get("aluno")
#     turma_id = body.get("turma")
#     disciplina_id = body.get("disciplina")
#     professor_id = body.get("professor")
#     ano_letivo = body.get("ano_letivo", 2026)
#     campos = body.get("notas", {})

#     if not all([aluno_id, turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Campos 'aluno', 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     try:
#         aluno = Estudante.objects.get(id=aluno_id)
#         turma = AtravessaPor.objects.get(id=turma_id)
#         disciplina = Disciplina.objects.get(id=disciplina_id)
#         professor = Professor.objects.get(id=professor_id)
#     except (Estudante.DoesNotExist, AtravessaPor.DoesNotExist,
#             Disciplina.DoesNotExist, Professor.DoesNotExist):
#         return JsonResponse({"message": "Aluno, turma, disciplina ou professor não encontrado."}, status=404)

#     nota, _ = Nota.objects.get_or_create(
#         aluno=aluno, turma=turma, disciplina=disciplina, ano_letivo=ano_letivo,
#         defaults={"professor": professor}
#     )

#     campos_decimais = [
#         "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
#         "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
#         "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
#         "pf", "rcf",
#     ]

#     erros = []
#     for campo in campos_decimais:
#         if campo in campos:
#             valor = _to_decimal(campos[campo])
#             if campos[campo] not in (None, "") and valor is None:
#                 erros.append(f"Valor inválido para {campo}: {campos[campo]}")
#                 continue
#             if valor is not None and (valor < 0 or valor > 10):
#                 erros.append(f"{campo} fora do intervalo (0-10): {valor}")
#                 continue
#             setattr(nota, campo, valor)

#     if "tgf" in campos:
#         try:
#             nota.tgf = int(campos["tgf"] or 0)
#         except (ValueError, TypeError):
#             erros.append(f"Valor inválido para tgf: {campos['tgf']}")

#     if "rf" in campos:
#         rf_valido = dict(Nota.RF_CHOICES)
#         if campos["rf"] in rf_valido:
#             nota.rf = campos["rf"]
#         else:
#             erros.append(f"RF inválido: {campos['rf']}")

#     nota.professor = professor
#     nota.save()  # dispara o cálculo automático de MT, MTF, MA, MAF

#     return JsonResponse({
#         "message": "Notas salvas com sucesso.",
#         "erros": erros,
#         "notas": {
#             "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
#             "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
#             "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
#             "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
#             "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
#             "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
#             "ma": float(nota.ma) if nota.ma is not None else None,
#             "maf": float(nota.maf) if nota.maf is not None else None,
#         }
#     })


# from decimal import Decimal, InvalidOperation
# from django.db.models.functions import Replace
# from django.db.models import Value
# from .models import Nota

# @csrf_exempt
# def get_notas_turma(request):
#     """Retorna todos os alunos de uma turma com suas notas (de uma disciplina) já lançadas."""
#     turma_id = request.GET.get("turma")
#     disciplina_id = request.GET.get("disciplina")
#     ano_letivo = request.GET.get("ano_letivo", "2026")

#     print("=== DEBUG get_notas_turma ===")
#     print("turma_id:", turma_id, "| disciplina_id:", disciplina_id)

#     if not turma_id or not disciplina_id:
#         return JsonResponse(
#             {"message": "Parâmetros 'turma' e 'disciplina' são obrigatórios."},
#             status=400
#         )

#     turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
#     if not turma_obj:
#         return JsonResponse({"message": "Turma não encontrada."}, status=404)

#     turma_dict = model_to_dict(turma_obj)
#     nome_turma_original = turma_dict.get("turma") or ""
#     nome_turma_normalizado = nome_turma_original.replace(" ", "").strip().lower()

#     print("nome_turma original:", repr(nome_turma_original))
#     print("nome_turma normalizado:", repr(nome_turma_normalizado))

#     # Normaliza também o campo 'turma' salvo em Estudante antes de comparar,
#     # removendo espaços e ignorando maiúsculas/minúsculas (mesma lógica usada
#     # em get_alunos_por_turma para contornar inconsistências de formatação).
#     alunos = Estudante.objects.annotate(
#         turma_normalizada=Replace("turma", Value(" "), Value(""))
#     ).filter(turma_normalizada__iexact=nome_turma_normalizado).order_by("nome_completo")

#     print("total de alunos encontrados:", alunos.count())
#     print("==============================")

#     def campo(obj, nome):
#         if obj is None:
#             return None
#         valor = getattr(obj, nome)
#         return float(valor) if valor is not None else None

#     resultado = []

#     for aluno in alunos:
#         nota = Nota.objects.filter(
#             aluno=aluno,
#             turma_id=turma_id,
#             disciplina_id=disciplina_id,
#             ano_letivo=ano_letivo,
#         ).first()

#         resultado.append({
#             "aluno_id": aluno.id,
#             "nome_completo": aluno.nome_completo,
#             "notas": {
#                 "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
#                 "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

#                 "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
#                 "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

#                 "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
#                 "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

#                 "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
#                 "rcf": campo(nota, "rcf"),
#                 "tgf": nota.tgf if nota else 0,
#                 "rf": nota.rf if nota else "CUR",
#             }
#         })

#     return JsonResponse({
#         "turma": nome_turma_original,
#         "total_alunos": len(resultado),
#         "alunos": resultado
#     })


# @csrf_exempt
# def salvar_notas_turma(request):
#     """Salva as notas de vários alunos de uma turma de uma vez."""
#     if request.method != "POST":
#         return JsonResponse({"message": "Método não permitido."}, status=405)

#     try:
#         body = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"message": "JSON inválido."}, status=400)

#     turma_id = body.get("turma")
#     disciplina_id = body.get("disciplina")
#     professor_id = body.get("professor")
#     ano_letivo = body.get("ano_letivo", 2026)
#     lancamentos = body.get("lancamentos", [])

#     if not all([turma_id, disciplina_id, professor_id]):
#         return JsonResponse(
#             {"message": "Campos 'turma', 'disciplina' e 'professor' são obrigatórios."},
#             status=400
#         )

#     if not lancamentos:
#         return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

#     try:
#         turma = AtravessaPor.objects.get(id=turma_id)
#         disciplina = Disciplina.objects.get(id=disciplina_id)
#         professor = Professor.objects.get(id=professor_id)
#     except (AtravessaPor.DoesNotExist, Disciplina.DoesNotExist, Professor.DoesNotExist):
#         return JsonResponse({"message": "Turma, disciplina ou professor não encontrado."}, status=404)

#     campos_decimais = [
#         "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
#         "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
#         "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
#         "pf", "rcf",
#     ]

#     rf_valido = dict(Nota.RF_CHOICES)

#     resultado_por_aluno = []
#     erros_gerais = []

#     for lancamento in lancamentos:
#         aluno_id = lancamento.get("aluno_id")
#         campos = lancamento.get("notas", {})

#         if not aluno_id:
#             erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
#             continue

#         try:
#             aluno = Estudante.objects.get(id=aluno_id)
#         except Estudante.DoesNotExist:
#             erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
#             continue

#         nota, _ = Nota.objects.get_or_create(
#             aluno=aluno, turma=turma, disciplina=disciplina, ano_letivo=ano_letivo,
#             defaults={"professor": professor}
#         )

#         erros_aluno = []

#         for campo in campos_decimais:
#             if campo in campos:
#                 valor_bruto = campos[campo]
#                 if valor_bruto in (None, ""):
#                     setattr(nota, campo, None)
#                     continue
#                 try:
#                     valor = Decimal(str(valor_bruto))
#                 except InvalidOperation:
#                     erros_aluno.append(f"Valor inválido em {campo}: {valor_bruto}")
#                     continue
#                 if valor < 0 or valor > 10:
#                     erros_aluno.append(f"{campo} fora do intervalo (0-10): {valor}")
#                     continue
#                 setattr(nota, campo, valor)

#         if "tgf" in campos:
#             try:
#                 nota.tgf = int(campos["tgf"] or 0)
#             except (ValueError, TypeError):
#                 erros_aluno.append(f"Valor inválido para tgf: {campos['tgf']}")

#         if "rf" in campos:
#             if campos["rf"] in rf_valido:
#                 nota.rf = campos["rf"]
#             else:
#                 erros_aluno.append(f"RF inválido: {campos['rf']}")

#         nota.professor = professor
#         nota.save()

#         resultado_por_aluno.append({
#             "aluno_id": aluno.id,
#             "nome_completo": aluno.nome_completo,
#             "erros": erros_aluno,
#             "notas": {
#                 "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
#                 "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
#                 "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
#                 "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
#                 "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
#                 "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
#                 "ma": float(nota.ma) if nota.ma is not None else None,
#                 "maf": float(nota.maf) if nota.maf is not None else None,
#             }
#         })

#     return JsonResponse({
#         "message": "Lançamentos processados.",
#         "erros_gerais": erros_gerais,
#         "resultado": resultado_por_aluno
#     })

# @csrf_exempt
# def get_turma(request):
#     turma = request.GET.get("turma")
#     professor_id = request.GET.get("professor")


#     turma = AtravessaPor.objects.filter(id=turma)

#     turma_dict = [model_to_dict(turma) for turma in turma]

#     return JsonResponse({ "turma": turma_dict[0] })


# @csrf_exempt
# def get_disciplinas_da_turma(request):
#     """
#     Retorna todas as disciplinas que o professor autenticado leciona
#     para o mesmo grupo de alunos (mesmo nome de turma) do turma_id informado.
#     Cada disciplina corresponde a um registro diferente de AtravessaPor.
#     """
#     turma_id = request.GET.get("turma")
#     professor_id = request.GET.get("professor")

#     if not all([turma_id, professor_id]):
#         return JsonResponse(
#             {"message": "Parâmetros 'turma' e 'professor' são obrigatórios."},
#             status=400
#         )

#     turma_atual = AtravessaPor.objects.filter(id=turma_id).first()
#     if not turma_atual:
#         return JsonResponse({"message": "Turma não encontrada."}, status=404)

#     nome_turma = turma_atual.turma

#     # Busca todos os registros de AtravessaPor do mesmo professor, para o
#     # mesmo grupo de alunos (nome de turma), cada um representando uma
#     # disciplina diferente lecionada por ele para essa turma.
#     registros = AtravessaPor.objects.filter(
#         turma=nome_turma, professor_id=professor_id
#     ).order_by("disciplina_lecionada")

#     disciplinas = [
#         {"turma_id": r.id, "disciplina": r.disciplina_lecionada}
#         for r in registros
#     ]

#     return JsonResponse({
#         "nome_turma": nome_turma,
#         "disciplinas": disciplinas
#     })