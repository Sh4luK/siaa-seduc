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
from .models import Nota    
from .models import Estudante
from .models import Professor
from .models import AtravessaPor
from .models import Disciplina
# from django.contrib.auth.models import User
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.hashers import check_password
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
    
    #https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/students/login?fullname=jose%20iraildes%20cipriano%20ribeiro%20filho&password=12345678
    
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

# @csrf_exempt
# def get_turma(request):
#     turma = request.GET.get("turma")
#     professor_id = request.GET.get("professor")


#     turma = AtravessaPor.objects.filter(id=turma)

#     turma_dict = [model_to_dict(turma) for turma in turma]

#     return JsonResponse({ "turma": turma_dict[0] })
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
    """Converte valor recebido em Decimal, retornando None se vazio/invalido."""
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor))
    except InvalidOperation:
        return None


@csrf_exempt
def get_notas_aluno(request):
    aluno_id = request.GET.get("aluno")
    turma_id = request.GET.get("turma")
    disciplina_id = request.GET.get("disciplina")
    ano_letivo = request.GET.get("ano_letivo", "2026")

    if not all([aluno_id, turma_id, disciplina_id]):
        return JsonResponse(
            {"message": "Parâmetros 'aluno', 'turma' e 'disciplina' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
    except Estudante.DoesNotExist:
        return JsonResponse({"message": "Aluno não encontrado."}, status=404)

    nota = Nota.objects.filter(
        aluno_id=aluno_id,
        turma_id=turma_id,
        disciplina_id=disciplina_id,
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
    disciplina_id = body.get("disciplina")
    professor_id = body.get("professor")
    ano_letivo = body.get("ano_letivo", 2026)
    campos = body.get("notas", {})

    if not all([aluno_id, turma_id, disciplina_id, professor_id]):
        return JsonResponse(
            {"message": "Campos 'aluno', 'turma', 'disciplina' e 'professor' são obrigatórios."},
            status=400
        )

    try:
        aluno = Estudante.objects.get(id=aluno_id)
        turma = AtravessaPor.objects.get(id=turma_id)
        disciplina = Disciplina.objects.get(id=disciplina_id)
        professor = Professor.objects.get(id=professor_id)
    except (Estudante.DoesNotExist, AtravessaPor.DoesNotExist,
            Disciplina.DoesNotExist, Professor.DoesNotExist):
        return JsonResponse({"message": "Aluno, turma, disciplina ou professor não encontrado."}, status=404)

    nota, _ = Nota.objects.get_or_create(
        aluno=aluno, turma=turma, disciplina=disciplina, ano_letivo=ano_letivo,
        defaults={"professor": professor}
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

    nota.professor = professor
    nota.save()  # dispara o cálculo automático de MT, MTF, MA, MAF

    return JsonResponse({
        "message": "Notas salvas com sucesso.",
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