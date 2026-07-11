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

@csrf_exempt
def get_turma(request):
    turma = request.GET.get("turma")
    professor_id = request.GET.get("professor")


    turma = AtravessaPor.objects.filter(id=turma)

    turma_dict = [model_to_dict(turma) for turma in turma]

    return JsonResponse({ "turma": turma_dict[0] })


@csrf_exempt
def get_alunos_por_turma(request):
    turma = request.GET.get("turma", "")

    # Normaliza o parâmetro recebido: remove todos os espaços
    turma_normalizada = turma.replace(" ", "").strip().lower()

    print("Turma recebida (normalizada):", repr(turma_normalizada))

    # Normaliza o campo 'turma' salvo no banco removendo espaços, depois compara
    alunos = Estudante.objects.annotate(
        turma_normalizada=Replace("turma", Value(" "), Value(""))
    ).filter(turma_normalizada__iexact=turma_normalizada)

    alunos_dict = [model_to_dict(aluno) for aluno in alunos]

    return JsonResponse({
        "alunos": alunos_dict,
        "total": len(alunos_dict)
    })