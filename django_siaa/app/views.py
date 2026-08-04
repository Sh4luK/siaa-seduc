from datetime import date
import unicodedata
from django.db.models.functions import Replace
from django.db.models import Value
from django.db.models.functions import Trim
from django.shortcuts import render, redirect
import requests
from django.http import HttpResponse, JsonResponse, request
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.conf import settings
import os
from dotenv import load_dotenv
from pathlib import Path
from .funcs import ip
from .funcs.get_ip import get_ip
from decimal import Decimal, InvalidOperation
from django.db.models.functions import Replace
from django.db.models import Value
from .models import Nota    
from .models import Estudante
from .models import Professor
from .models import AtravessaPor
from .models import Disciplina
from .models import Frequencia
from .models import Aula
from .models import Evento
from .models import Conteudo
import json

load_dotenv()

api = os.getenv("IP_API")

@csrf_exempt
def index(request):
    return HttpResponse("Olá usuario! Esta é a API do SIAA.")

@csrf_exempt
def login_api(request):
    pass


@csrf_exempt
def register_api(request):
    pass

@csrf_exempt
def AdminApiLoginSuperUser(request):
    if request.method == "POST":
        data = json.loads(request.POST)
        cpf = data.get("cpf")
        password = data.get("password")
        return JsonResponse({
            cpf,
            password
        })
    else:
        return HttpResponse("error")

@csrf_exempt
def view_students(request):
    file = Path("/workspaces/siaa-seduc/infra/alunos_formatados.json")
    if not file.exists():
        file = Path(__file__).resolve().parent.parent / "alunos_formatados.json"
    
    if not file.exists():
        return JsonResponse({
            "message": "Caminho não encontrado."
        })
    
    try:
        with open(file, "r", encoding="utf-8") as data:
            data_students = json.load(data)
        
        return JsonResponse(data_students, status=200, json_dumps_params={ "ensure_ascii": False })
    
    except json.JSONDecodeError:
        return JsonResponse({
            "message": "Erro ao ler o arquivo JSON"
        })

# @csrf_exempt
def search_student(request):
    fullName = request.GET.get("fullname", "").strip().lower()
    course = request.GET.get("course", "").strip().lower()

    file = Path("/workspaces/siaa-seduc/infra/alunos_formatados.json")
    if not file.exists():
        file = Path(__file__).resolve().parent.parent / "alunos_formatados.json"
    
    try:
        with open(file, "r", encoding="utf-8") as f:
            students_data = json.load(f)
        
        results = []

        for page_id, page_content in students_data.items():
            students_list = page_content.get("alunos", [])

            for student in students_list:
                student_name = student.get('nome_completo', '')

                if fullName and fullName not in student_name.lower():
                    continue

                results.append({
                    "posicao_ordem": student.get('posicao_ordem'),
                    "nome_completo": student_name,
                    "escola": page_content.get('escola'),
                    "serie": page_content.get('serie'),
                    "turma": page_content.get('turma'),
                    "periodo": page_content.get('periodo'),
                    "curso": page_content.get('curso')
                })


        # for student in students_data:
        #     match_fullname = True
        #     match_course = True

        #     if fullName and fullName not in student.get('nome_completo', '').lower():
        #         match_name = False
            
        #     if course and course != student.get('curso', '').lower():
        #         match_course = False
            
        #     if match_name and match_course:
        #         results.append(student)

        print({
            "total_encontrado": len(results),
            "estudante": results
        })  
        return JsonResponse({
            "total_encontrado": len(results),
            "estudante": results
        })
    except FileNotFoundError:
        return JsonResponse({"erro": "Arquivo data.json não encontrado."})
    except json.JSONDecodeError:
        return JsonResponse({"erro": "Erro ao processar o arquivo JSON."})


@csrf_exempt
def login_student(request):
    ip_student = get_ip()
    print(ip_student)
    fullName = request.GET.get("fullname").strip().upper()
    password = request.GET.get("password").strip().lower()
    
    student = Estudante.objects.filter(nome_completo=fullName, senha=password).first()
    print({
        fullName,
        password
    })
    print(student)
    print(ip_student)
    if student is None:
        return JsonResponse({
            "return": False
        })
    else:
        update = Estudante.objects.filter(nome_completo=fullName, senha=password).update(ip=ip_student)
        return JsonResponse({
            "return": True
        })
    
    
@csrf_exempt
def auth_student(request):
    ip_student = get_ip()
    print(ip_student)
    student = Estudante.objects.filter(ip=ip_student).first()
    try:
        student = model_to_dict(student)
        if student is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "student": student,
                "return": True
            })
    except:
        return JsonResponse({
            "message": "Usuario nao encontrado.",
            "return": None
        })
        
    

@csrf_exempt
def login_teacher(request):
    ip = get_ip()
    print(ip)
    nome_completo = request.GET.get("nome_completo").strip().upper()
    senha = request.GET.get("senha").strip().upper()


    getProfessor = Professor.objects.filter(nome_completo=nome_completo, senha=senha).first()

    print(getProfessor)

    if getProfessor is None:
        return JsonResponse({
            "return": False
        })
    else:
        updateProfessor = Professor.objects.filter(nome_completo=nome_completo, senha=senha).update(ip=ip)
        return JsonResponse({
            "return": True
        })

@csrf_exempt
def auth_teacher(request):
    ip = get_ip()
    teacher = Professor.objects.filter(ip=ip).first()
    print(teacher)
    try:
        teacher = model_to_dict(teacher)
        print(teacher)
        if teacher is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "teacher": teacher
            })
    except:
        return JsonResponse({
            "return": None,
            "message": "error"
        })
        
def search_teacher(request):
    nome_completo = request.GET.get("nome_completo").strip().upper()

    try:
        professor = Professor.objects.filter(nome_completo=nome_completo).first()
        professor_dict = model_to_dict(professor)
        if professor is None:
            return JsonResponse({
                "return": False
            })
        else:
            return JsonResponse({
                "return": True,
                "teacher": professor_dict
            })
    except:
        return JsonResponse({
            "return": False,
            "message": "Erro na procura do Professor."
        })

        

@csrf_exempt
def get_turmas(request):
    nome_completo = request.GET.get("nome_completo").strip().upper()
    teacher = model_to_dict(Professor.objects.filter(nome_completo=nome_completo).first())
    
    turmas = AtravessaPor.objects.filter(professor_id=teacher["id"])
    turmas_dict = [model_to_dict(turma) for turma in turmas]

    return JsonResponse({
        "professor": teacher,
        "turmas": turmas_dict
    })

@csrf_exempt
def get_disciplinas_lecionadas(request):
    nome_completo = request.GET.get("nome_completo", "").strip().upper()

    if not nome_completo:
        return JsonResponse({"detail": "O parâmetro 'nome_completo' é obrigatório."}, status=400)

    professor_instance = Professor.objects.filter(nome_completo=nome_completo).first()

    if not professor_instance:
        return JsonResponse({"detail": "Professor não encontrado."}, status=404)

    professor = model_to_dict(professor_instance)

    disciplinas_lecionadas = Disciplina.objects.filter(professores=professor["id"])
    disciplinas_lecionadas_dict = [
        model_to_dict(disciplina, exclude=["professores"])
        for disciplina in disciplinas_lecionadas
    ]

    return JsonResponse({"disciplinas": disciplinas_lecionadas_dict})


@csrf_exempt
def get_turma(request):
    turma_id = request.GET.get("turma")

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()

    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    turma_dict = model_to_dict(turma_obj)

    # Resolve o ID da disciplina a partir do texto 'disciplina_lecionada'
    disciplina_id = None
    nome_disciplina = turma_dict.get("disciplina_lecionada", "").strip()

    if nome_disciplina:
        disciplina_obj = Disciplina.objects.filter(
            nome_disciplina__iexact=nome_disciplina
        ).first()

        if disciplina_obj:
            disciplina_id = disciplina_obj.id

    turma_dict["disciplina_id"] = disciplina_id

    return JsonResponse({"turma": turma_dict})

@csrf_exempt
def get_alunos_por_turma(request):
    turma = request.GET.get("turma", "")

    turma_normalizada = turma.replace(" ", "").strip().lower()

    print("Turma recebida (normalizada):", repr(turma_normalizada))

    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=turma_normalizada)

    alunos_dict = [model_to_dict(aluno) for aluno in alunos]

    return JsonResponse({
        "alunos": alunos_dict,
        "total": len(alunos_dict)
    })


def _to_decimal(valor):
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor))
    except InvalidOperation:
        return None


def buscar_alunos_por_turma(nome_turma):
    """
    Busca alunos no model Estudante cujo campo 'turma' bate com o nome informado,
    normalizando espaços e ignorando maiúsculas/minúsculas.
    """
    nome_normalizado = (nome_turma or "").replace(" ", "").strip().lower()

    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=nome_normalizado).order_by("posicao_ordem", "nome_completo")

    return alunos


def _normalizar_texto(texto):
    texto = texto or ""
    texto = unicodedata.normalize("NFC", texto)
    return texto.replace(" ", "").strip().lower()


def resolver_disciplina_da_turma(turma_obj):
    nome_busca = _normalizar_texto(turma_obj.disciplina_lecionada)
    print("DEBUG - buscando (normalizado):", repr(nome_busca))
    print("DEBUG - bytes do texto buscado:", nome_busca.encode("utf-8"))

    if not nome_busca:
        return None

    for disciplina in Disciplina.objects.all():
        nome_disc_normalizado = _normalizar_texto(disciplina.nome_disciplina)
        if "quim" in nome_disc_normalizado or "quí" in nome_disc_normalizado:
            print("DEBUG - candidato:", repr(nome_disc_normalizado))
            print("DEBUG - bytes do candidato:", nome_disc_normalizado.encode("utf-8"))
            print("DEBUG - são iguais?", nome_disc_normalizado == nome_busca)

    for disciplina in Disciplina.objects.all():
        if _normalizar_texto(disciplina.nome_disciplina) == nome_busca:
            return disciplina

    return None


@csrf_exempt
def get_notas_aluno(request):
    aluno_id = request.GET.get("aluno")
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not all([aluno_id, turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'aluno', 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
    except Estudante.DoesNotExist:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nota = Nota.objects.filter(
        aluno_id=aluno_id,
        turma_id=turma_id,
        disciplina=disciplina,
        professor_id=professor_id,
        ano_letivo=ano_letivo,
    ).first()

    def campo(obj, nome):
        if obj is None:
            return None
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    dados = {
        "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
        "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

        "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
        "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

        "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
        "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

        "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
        "rcf": campo(nota, "rcf"),
        "tgf": nota.tgf if nota else 0,
        "rf": nota.rf if nota else "CUR",
    }

    return JsonResponse({
        "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo},
        "disciplina": {"id": disciplina.id, "nome": disciplina.nome_disciplina},
        "notas": dados,
    })


@csrf_exempt
def salvar_notas(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    aluno_id = body.get("aluno")
    turma_id = body.get("turma")
    professor_id = body.get("professor")
    ano_letivo = body.get("ano_letivo", 2026)
    campos = body.get("notas", {})

    if not all([aluno_id, turma_id, professor_id]):
        return JsonResponse(
            {"message": "Campos 'aluno', 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (Estudante.DoesNotExist, AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Aluno, turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nota, _ = Nota.objects.get_or_create(
        aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
    )

    campos_decimais = [
        "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
        "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
        "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
        "pf", "rcf",
    ]

    erros = []
    for campo in campos_decimais:
        if campo in campos:
            valor = _to_decimal(campos[campo])
            if campos[campo] not in (None, "") and valor is None:
                erros.append(f"Valor inválido para {campo}: {campos[campo]}")
                continue
            if valor is not None and (valor < 0 or valor > 10):
                erros.append(f"{campo} fora do intervalo (0-10): {valor}")
                continue
            setattr(nota, campo, valor)

    if "tgf" in campos:
        try:
            nota.tgf = int(campos["tgf"] or 0)
        except (ValueError, TypeError):
            erros.append(f"Valor inválido para tgf: {campos['tgf']}")

    if "rf" in campos:
        rf_valido = dict(Nota.RF_CHOICES)
        if campos["rf"] in rf_valido:
            nota.rf = campos["rf"]
        else:
            erros.append(f"RF inválido: {campos['rf']}")

    nota.save()

    return JsonResponse({
        "message": "Notas salvas com sucesso.",
        "disciplina": disciplina.nome_disciplina,
        "erros": erros,
        "notas": {
            "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
            "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
            "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
            "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
            "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
            "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
            "ma": float(nota.ma) if nota.ma is not None else None,
            "maf": float(nota.maf) if nota.maf is not None else None,
        }
    })


@csrf_exempt
def get_notas_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nome_turma = turma_obj.turma
    alunos = buscar_alunos_por_turma(nome_turma)

    def campo(obj, nome):
        if obj is None:
            return None
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    resultado = []

    for aluno in alunos:
        nota = Nota.objects.filter(
            aluno=aluno,
            turma_id=turma_id,
            disciplina=disciplina,
            professor_id=professor_id,
            ano_letivo=ano_letivo,
        ).first()

        resultado.append({
            "aluno_id": aluno.id,
            "posicao_ordem": aluno.posicao_ordem,
            "nome_completo": aluno.nome_completo,
            "notas": {
                "nm1_t1": campo(nota, "nm1_t1"), "nm2_t1": campo(nota, "nm2_t1"), "nm3_t1": campo(nota, "nm3_t1"),
                "rpt_t1": campo(nota, "rpt_t1"), "mt_t1": campo(nota, "mt_t1"), "mtf_t1": campo(nota, "mtf_t1"),

                "nm1_t2": campo(nota, "nm1_t2"), "nm2_t2": campo(nota, "nm2_t2"), "nm3_t2": campo(nota, "nm3_t2"),
                "rpt_t2": campo(nota, "rpt_t2"), "mt_t2": campo(nota, "mt_t2"), "mtf_t2": campo(nota, "mtf_t2"),

                "nm1_t3": campo(nota, "nm1_t3"), "nm2_t3": campo(nota, "nm2_t3"), "nm3_t3": campo(nota, "nm3_t3"),
                "rpt_t3": campo(nota, "rpt_t3"), "mt_t3": campo(nota, "mt_t3"), "mtf_t3": campo(nota, "mtf_t3"),

                "ma": campo(nota, "ma"), "pf": campo(nota, "pf"), "maf": campo(nota, "maf"),
                "rcf": campo(nota, "rcf"),
                "tgf": nota.tgf if nota else 0,
                "rf": nota.rf if nota else "CUR",
            }
        })

    return JsonResponse({
        "turma": nome_turma,
        "disciplina": disciplina.nome_disciplina,
        "total_alunos": len(resultado),
        "alunos": resultado
    })


@csrf_exempt
def salvar_notas_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    turma_id = body.get("turma")
    professor_id = body.get("professor")
    ano_letivo = body.get("ano_letivo", 2026)
    lancamentos = body.get("lancamentos", [])

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Campos 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    if not lancamentos:
        return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

    try:
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    campos_decimais = [
        "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
        "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
        "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
        "pf", "rcf",
    ]

    rf_valido = dict(Nota.RF_CHOICES)

    resultado_por_aluno = []
    erros_gerais = []

    for lancamento in lancamentos:
        aluno_id = lancamento.get("aluno_id")
        campos = lancamento.get("notas", {})

        if not aluno_id:
            erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
            continue

        try:
            aluno = Estudante.objects.get(id=aluno_id)
        except Estudante.DoesNotExist:
            erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
            continue

        nota, _ = Nota.objects.get_or_create(
            aluno=aluno, turma=turma, disciplina=disciplina, professor=professor, ano_letivo=ano_letivo,
        )

        erros_aluno = []

        for campo in campos_decimais:
            if campo in campos:
                valor_bruto = campos[campo]
                if valor_bruto in (None, ""):
                    setattr(nota, campo, None)
                    continue
                try:
                    valor = Decimal(str(valor_bruto))
                except InvalidOperation:
                    erros_aluno.append(f"Valor inválido em {campo}: {valor_bruto}")
                    continue
                if valor < 0 or valor > 10:
                    erros_aluno.append(f"{campo} fora do intervalo (0-10): {valor}")
                    continue
                setattr(nota, campo, valor)

        if "tgf" in campos:
            try:
                nota.tgf = int(campos["tgf"] or 0)
            except (ValueError, TypeError):
                erros_aluno.append(f"Valor inválido para tgf: {campos['tgf']}")

        if "rf" in campos:
            if campos["rf"] in rf_valido:
                nota.rf = campos["rf"]
            else:
                erros_aluno.append(f"RF inválido: {campos['rf']}")

        nota.save()

        resultado_por_aluno.append({
            "aluno_id": aluno.id,
            "nome_completo": aluno.nome_completo,
            "erros": erros_aluno,
            "notas": {
                "mt_t1": float(nota.mt_t1) if nota.mt_t1 is not None else None,
                "mtf_t1": float(nota.mtf_t1) if nota.mtf_t1 is not None else None,
                "mt_t2": float(nota.mt_t2) if nota.mt_t2 is not None else None,
                "mtf_t2": float(nota.mtf_t2) if nota.mtf_t2 is not None else None,
                "mt_t3": float(nota.mt_t3) if nota.mt_t3 is not None else None,
                "mtf_t3": float(nota.mtf_t3) if nota.mtf_t3 is not None else None,
                "ma": float(nota.ma) if nota.ma is not None else None,
                "maf": float(nota.maf) if nota.maf is not None else None,
            }
        })

    return JsonResponse({
        "message": "Lançamentos processados.",
        "disciplina": disciplina.nome_disciplina,
        "erros_gerais": erros_gerais,
        "resultado": resultado_por_aluno
    })

@csrf_exempt
def get_boletim_aluno(request):
    """
    Retorna o boletim completo do aluno autenticado: todas as disciplinas
    que ele cursa, com notas trimestrais, resultado final, faltas e situação.
    Autenticação feita pelo IP, igual ao restante do fluxo do aluno.
    """
    ip_aluno = get_ip()
    aluno = Estudante.objects.filter(ip=ip_aluno).first()

    if not aluno:
        return JsonResponse({"message": "Aluno não autenticado."}, status=401)

    ano_letivo = request.GET.get("ano_letivo", "2026")

    notas = Nota.objects.filter(
        aluno=aluno, ano_letivo=ano_letivo
    ).select_related("disciplina").order_by("disciplina__nome_disciplina")

    def campo(obj, nome):
        valor = getattr(obj, nome)
        return float(valor) if valor is not None else None

    resultado = []
    for nota in notas:
        resultado.append({
            "disciplina": nota.disciplina.nome_disciplina,
            "t1": {
                "nm1": campo(nota, "nm1_t1"), "nm2": campo(nota, "nm2_t1"), "nm3": campo(nota, "nm3_t1"),
                "mt": campo(nota, "mt_t1"), "rpt": campo(nota, "rpt_t1"), "mtf": campo(nota, "mtf_t1"),
            },
            "t2": {
                "nm1": campo(nota, "nm1_t2"), "nm2": campo(nota, "nm2_t2"), "nm3": campo(nota, "nm3_t2"),
                "mt": campo(nota, "mt_t2"), "rpt": campo(nota, "rpt_t2"), "mtf": campo(nota, "mtf_t2"),
            },
            "t3": {
                "nm1": campo(nota, "nm1_t3"), "nm2": campo(nota, "nm2_t3"), "nm3": campo(nota, "nm3_t3"),
                "mt": campo(nota, "mt_t3"), "rpt": campo(nota, "rpt_t3"), "mtf": campo(nota, "mtf_t3"),
            },
            "ma": campo(nota, "ma"),
            "pf": campo(nota, "pf"),
            "maf": campo(nota, "maf"),
            "rcf": campo(nota, "rcf"),
            "tgf": nota.tgf,
            "rf": nota.rf,
        })

    return JsonResponse({
        "aluno": {"id": aluno.id, "nome_completo": aluno.nome_completo, "turma": aluno.turma},
        "total_disciplinas": len(resultado),
        "disciplinas": resultado
    })


@csrf_exempt
def get_disciplinas_da_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")

    if not all([turma_id, professor_id]):
        return JsonResponse(
            {"message": "Parâmetros 'turma' e 'professor' são obrigatórios."},
            status=400
        )

    turma_atual = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_atual:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    nome_turma = turma_atual.turma

    registros = AtravessaPor.objects.filter(
        turma=nome_turma, professor_id=professor_id
    ).order_by("disciplina_lecionada")

    disciplinas = [
        {"turma_id": r.id, "disciplina": r.disciplina_lecionada}
        for r in registros
    ]

    return JsonResponse({
        "nome_turma": nome_turma,
        "disciplinas": disciplinas
    })



# @csrf_exempt
# def get_frequencia_turma(request):
#     """
#     Retorna todos os alunos da turma com o status de presença/falta
#     em uma data específica, para a disciplina resolvida automaticamente
#     a partir do turma_id.
#     """
#     turma_id = request.GET.get("turma")
#     professor_id = request.GET.get("professor")
#     data_str = request.GET.get("data")

#     if not all([turma_id, professor_id, data_str]):
#         return JsonResponse(
#             {"message": "Parâmetros 'turma', 'professor' e 'data' são obrigatórios."},
#             status=400
#         )

#     try:
#         data_selecionada = date.fromisoformat(data_str)
#     except ValueError:
#         return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

#     turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
#     if not turma_obj:
#         return JsonResponse({"message": "Turma não encontrada."}, status=404)

#     disciplina = resolver_disciplina_da_turma(turma_obj)
#     if not disciplina:
#         return JsonResponse(
#             {"message": "Não foi possível resolver a disciplina associada a esta turma."},
#             status=404
#         )

#     nome_turma = turma_obj.turma
#     alunos = buscar_alunos_por_turma(nome_turma)

#     resultado = []
#     for aluno in alunos:
#         registro = Frequencia.objects.filter(
#             aluno=aluno,
#             turma_id=turma_id,
#             disciplina=disciplina,
#             professor_id=professor_id,
#             data=data_selecionada,
#         ).first()

#         resultado.append({
#             "aluno_id": aluno.id,
#             "posicao_ordem": aluno.posicao_ordem,
#             "nome_completo": aluno.nome_completo,
#             "presente": registro.presente if registro else True,
#         })

#     return JsonResponse({
#         "turma": nome_turma,
#         "disciplina": disciplina.nome_disciplina,
#         "data": data_str,
#         "total_alunos": len(resultado),
#         "alunos": resultado
#     })


# @csrf_exempt
# def salvar_frequencia_turma(request):
#     """Salva a frequência de todos os alunos de uma turma para uma data específica."""
#     if request.method != "POST":
#         return JsonResponse({"message": "Método não permitido."}, status=405)

#     try:
#         body = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"message": "JSON inválido."}, status=400)

#     turma_id = body.get("turma")
#     professor_id = body.get("professor")
#     data_str = body.get("data")
#     ano_letivo = body.get("ano_letivo", 2026)
#     lancamentos = body.get("lancamentos", [])  # [{ aluno_id, presente }]

#     if not all([turma_id, professor_id, data_str]):
#         return JsonResponse(
#             {"message": "Campos 'turma', 'professor' e 'data' são obrigatórios."},
#             status=400
#         )

#     try:
#         data_selecionada = date.fromisoformat(data_str)
#     except ValueError:
#         return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

#     if not lancamentos:
#         return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

#     try:
#         turma = AtravessaPor.objects.get(id=turma_id)
#         professor = Professor.objects.get(id=professor_id)
#     except (AtravessaPor.DoesNotExist, Professor.DoesNotExist):
#         return JsonResponse({"message": "Turma ou professor não encontrado."}, status=404)

#     disciplina = resolver_disciplina_da_turma(turma)
#     if not disciplina:
#         return JsonResponse(
#             {"message": "Não foi possível resolver a disciplina associada a esta turma."},
#             status=404
#         )

#     erros_gerais = []
#     total_salvos = 0

#     for lancamento in lancamentos:
#         aluno_id = lancamento.get("aluno_id")
#         presente = lancamento.get("presente", True)

#         if not aluno_id:
#             erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
#             continue

#         try:
#             aluno = Estudante.objects.get(id=aluno_id)
#         except Estudante.DoesNotExist:
#             erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
#             continue

#         Frequencia.objects.update_or_create(
#             aluno=aluno,
#             turma=turma,
#             disciplina=disciplina,
#             professor=professor,
#             data=data_selecionada,
#             defaults={"presente": bool(presente), "ano_letivo": ano_letivo},
#         )
#         total_salvos += 1

#     return JsonResponse({
#         "message": "Frequência salva com sucesso.",
#         "disciplina": disciplina.nome_disciplina,
#         "data": data_str,
#         "total_salvos": total_salvos,
#         "erros_gerais": erros_gerais,
#     })


from .models import Frequencia, Aula

@csrf_exempt
def get_frequencia_turma(request):
    turma_id = request.GET.get("turma")
    professor_id = request.GET.get("professor")
    data_str = request.GET.get("data")

    if not all([turma_id, professor_id, data_str]):
        return JsonResponse(
            {"message": "Parâmetros 'turma', 'professor' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_selecionada = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    turma_obj = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma_obj:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma_obj)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    nome_turma = turma_obj.turma
    alunos = buscar_alunos_por_turma(nome_turma)

    resultado = []
    for aluno in alunos:
        registro = Frequencia.objects.filter(
            aluno=aluno,
            turma_id=turma_id,
            disciplina=disciplina,
            professor_id=professor_id,
            data=data_selecionada,
        ).first()

        resultado.append({
            "aluno_id": aluno.id,
            "posicao_ordem": aluno.posicao_ordem,
            "nome_completo": aluno.nome_completo,
            "presente": registro.presente if registro else True,
        })

    aula = Aula.objects.filter(
        turma_id=turma_id, disciplina=disciplina, professor_id=professor_id, data=data_selecionada
    ).first()

    return JsonResponse({
        "turma": nome_turma,
        "disciplina": disciplina.nome_disciplina,
        "data": data_str,
        "assunto": aula.assunto if aula else "",
        "total_alunos": len(resultado),
        "alunos": resultado
    })


@csrf_exempt
def salvar_frequencia_turma(request):
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    turma_id = body.get("turma")
    professor_id = body.get("professor")
    data_str = body.get("data")
    ano_letivo = body.get("ano_letivo", 2026)
    assunto = body.get("assunto", "")
    lancamentos = body.get("lancamentos", [])

    if not all([turma_id, professor_id, data_str]):
        return JsonResponse(
            {"message": "Campos 'turma', 'professor' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_selecionada = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    if not lancamentos:
        return JsonResponse({"message": "Nenhum lançamento enviado."}, status=400)

    try:
        turma = AtravessaPor.objects.get(id=turma_id)
        professor = Professor.objects.get(id=professor_id)
    except (AtravessaPor.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Turma ou professor não encontrado."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    # Salva/atualiza o assunto do dia
    Aula.objects.update_or_create(
        turma=turma, disciplina=disciplina, professor=professor, data=data_selecionada,
        defaults={"assunto": assunto, "ano_letivo": ano_letivo},
    )

    erros_gerais = []
    total_salvos = 0

    for lancamento in lancamentos:
        aluno_id = lancamento.get("aluno_id")
        presente = lancamento.get("presente", True)

        if not aluno_id:
            erros_gerais.append("Lançamento sem 'aluno_id' foi ignorado.")
            continue

        try:
            aluno = Estudante.objects.get(id=aluno_id)
        except Estudante.DoesNotExist:
            erros_gerais.append(f"Aluno com id {aluno_id} não encontrado — ignorado.")
            continue

        Frequencia.objects.update_or_create(
            aluno=aluno,
            turma=turma,
            disciplina=disciplina,
            professor=professor,
            data=data_selecionada,
            defaults={"presente": bool(presente), "ano_letivo": ano_letivo},
        )
        total_salvos += 1

    return JsonResponse({
        "message": "Frequência salva com sucesso.",
        "disciplina": disciplina.nome_disciplina,
        "data": data_str,
        "total_salvos": total_salvos,
        "erros_gerais": erros_gerais,
    })



@csrf_exempt
def get_registros_frequencia(request):
    """
    Lista os registros de frequência já feitos pelo professor, agrupados
    por turma + disciplina + data (uma linha por aula ministrada).
    """
    professor_id = request.GET.get("professor")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    aulas = Aula.objects.filter(
        professor_id=professor_id, ano_letivo=ano_letivo
    ).select_related("turma", "disciplina").order_by("-data")

    resultado = []
    for aula in aulas:
        total_alunos = Frequencia.objects.filter(
            turma=aula.turma, disciplina=aula.disciplina, professor_id=professor_id, data=aula.data
        ).count()
        total_presentes = Frequencia.objects.filter(
            turma=aula.turma, disciplina=aula.disciplina, professor_id=professor_id, data=aula.data, presente=True
        ).count()

        resultado.append({
            "turma_id": aula.turma.id,
            "nome_turma": aula.turma.turma,
            "disciplina": aula.disciplina.nome_disciplina,
            "data": aula.data.isoformat(),
            "assunto": aula.assunto,
            "total_alunos": total_alunos,
            "total_presentes": total_presentes,
            "total_faltas": total_alunos - total_presentes,
        })

    return JsonResponse({
        "total_registros": len(resultado),
        "registros": resultado
    })



@csrf_exempt
def get_eventos(request):
    """Lista os eventos do professor, opcionalmente filtrados por mês/ano ou turma."""
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")   # ex: "07"
    ano = request.GET.get("ano")   # ex: "2026"
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    eventos = Evento.objects.filter(professor_id=professor_id).select_related("turma")

    if mes and ano:
        eventos = eventos.filter(data__year=ano, data__month=mes)
    elif ano:
        eventos = eventos.filter(data__year=ano)

    if turma_id:
        eventos = eventos.filter(turma_id=turma_id)

    resultado = [
        {
            "id": e.id,
            "titulo": e.titulo,
            "descricao": e.descricao,
            "data": e.data.isoformat(),
            "turma_id": e.turma_id,
            "nome_turma": e.turma.turma if e.turma else None,
        }
        for e in eventos
    ]

    return JsonResponse({
        "total_eventos": len(resultado),
        "eventos": resultado
    })


@csrf_exempt
def criar_evento(request):
    """Cria um novo evento no calendário escolar."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON inválido."}, status=400)

    professor_id = body.get("professor")
    titulo = (body.get("titulo") or "").strip()
    descricao = (body.get("descricao") or "").strip()
    data_str = body.get("data")
    turma_id = body.get("turma")  # opcional

    if not all([professor_id, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_evento = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turma = None
    if turma_id:
        turma = AtravessaPor.objects.filter(id=turma_id).first()
        if not turma:
            return JsonResponse({"message": "Turma não encontrada."}, status=404)

    evento = Evento.objects.create(
        professor=professor,
        turma=turma,
        titulo=titulo,
        descricao=descricao,
        data=data_evento,
    )

    return JsonResponse({
        "message": "Evento criado com sucesso.",
        "evento": {
            "id": evento.id,
            "titulo": evento.titulo,
            "descricao": evento.descricao,
            "data": evento.data.isoformat(),
            "turma_id": evento.turma_id,
            "nome_turma": evento.turma.turma if evento.turma else None,
        }
    })


@csrf_exempt
def deletar_evento(request, evento_id):
    """Remove um evento do calendário."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    evento = Evento.objects.filter(id=evento_id).first()
    if not evento:
        return JsonResponse({"message": "Evento não encontrado."}, status=404)

    evento.delete()
    return JsonResponse({"message": "Evento removido com sucesso."})



@csrf_exempt
def get_conteudos(request):
    """Lista os conteúdos do professor, opcionalmente filtrados por mês/ano ou turma."""
    professor_id = request.GET.get("professor")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")
    turma_id = request.GET.get("turma")

    if not professor_id:
        return JsonResponse({"message": "Parâmetro 'professor' é obrigatório."}, status=400)

    conteudos = Conteudo.objects.filter(professor_id=professor_id).select_related("turma", "disciplina")

    if mes and ano:
        conteudos = conteudos.filter(data__year=ano, data__month=mes)
    elif ano:
        conteudos = conteudos.filter(data__year=ano)

    if turma_id:
        conteudos = conteudos.filter(turma_id=turma_id)

    resultado = [
        {
            "id": c.id,
            "titulo": c.titulo,
            "descricao": c.descricao,
            "data": c.data.isoformat(),
            "turma_id": c.turma_id,
            "nome_turma": c.turma.turma,
            "disciplina": c.disciplina.nome_disciplina,
            "arquivo_url": request.build_absolute_uri(c.arquivo.url) if c.arquivo else None,
            "arquivo_nome": c.arquivo.name.split("/")[-1] if c.arquivo else None,
        }
        for c in conteudos
    ]

    return JsonResponse({
        "total_conteudos": len(resultado),
        "conteudos": resultado
    })


@csrf_exempt
def criar_conteudo(request):
    """Cria um novo conteúdo. Aceita multipart/form-data por causa do arquivo opcional."""
    if request.method != "POST":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    professor_id = request.POST.get("professor")
    turma_id = request.POST.get("turma")
    titulo = (request.POST.get("titulo") or "").strip()
    descricao = (request.POST.get("descricao") or "").strip()
    data_str = request.POST.get("data")
    arquivo = request.FILES.get("arquivo")

    if not all([professor_id, turma_id, titulo, data_str]):
        return JsonResponse(
            {"message": "Campos 'professor', 'turma', 'titulo' e 'data' são obrigatórios."},
            status=400
        )

    try:
        data_conteudo = date.fromisoformat(data_str)
    except ValueError:
        return JsonResponse({"message": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

    try:
        professor = Professor.objects.get(id=professor_id)
    except Professor.DoesNotExist:
        return JsonResponse({"message": "Professor não encontrado."}, status=404)

    turma = AtravessaPor.objects.filter(id=turma_id).first()
    if not turma:
        return JsonResponse({"message": "Turma não encontrada."}, status=404)

    disciplina = resolver_disciplina_da_turma(turma)
    if not disciplina:
        return JsonResponse(
            {"message": "Não foi possível resolver a disciplina associada a esta turma."},
            status=404
        )

    conteudo = Conteudo.objects.create(
        professor=professor,
        turma=turma,
        disciplina=disciplina,
        titulo=titulo,
        descricao=descricao,
        data=data_conteudo,
        arquivo=arquivo,
    )

    return JsonResponse({
        "message": "Conteúdo criado com sucesso.",
        "conteudo": {
            "id": conteudo.id,
            "titulo": conteudo.titulo,
            "descricao": conteudo.descricao,
            "data": conteudo.data.isoformat(),
            "turma_id": conteudo.turma_id,
            "nome_turma": conteudo.turma.turma,
            "disciplina": conteudo.disciplina.nome_disciplina,
            "arquivo_url": request.build_absolute_uri(conteudo.arquivo.url) if conteudo.arquivo else None,
        }
    })


@csrf_exempt
def deletar_conteudo(request, conteudo_id):
    """Remove um conteúdo."""
    if request.method != "DELETE":
        return JsonResponse({"message": "Método não permitido."}, status=405)

    conteudo = Conteudo.objects.filter(id=conteudo_id).first()
    if not conteudo:
        return JsonResponse({"message": "Conteúdo não encontrado."}, status=404)

    conteudo.delete()
    return JsonResponse({"message": "Conteúdo removido com sucesso."})