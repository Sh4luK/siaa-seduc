from django.shortcuts import render, redirect
import requests
from django.http import HttpResponse, JsonResponse, request
from django.views.decorators.csrf import csrf_exempt
import os
from dotenv import load_dotenv
from .models import User
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
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            registration = data.get("registration")
            password = data.get("password")
            user = User.objects.filter(registration=registration, password=password).first()
            if not user:
                return JsonResponse({"error": "Matrícula ou senha inválidos."})
            
            print(user.full_name)
            return JsonResponse({"message": f"Login bem-sucedido para matrícula {registration}."})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Dados inválidos."}, status=400)

    return HttpResponse("Login API - Metodo de requisição invalido.")


@csrf_exempt
def register_api(request):

    return HttpResponse("Cadastro API - Metodo de requisição invalido.")
