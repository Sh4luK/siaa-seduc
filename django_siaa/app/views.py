from django.shortcuts import render, redirect
import requests
from django.http import HttpResponse, JsonResponse, request
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
from dotenv import load_dotenv
from pathlib import Path
from .funcs import ip
from .funcs.get_ip import get_ip
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
    ip_student = get_ip(request)
    fullName = request.GET.get("fullname").strip().lower()
    password = request.GET.get("fullname").strip().lower()

    