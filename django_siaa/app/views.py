from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse, request
from django.views.decorators.csrf import csrf_exempt
# from .models import User
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
import json

@csrf_exempt
def index(request):
    return HttpResponse("Hello, world! This is the SIAA API.")

@csrf_exempt
def login_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")
            print(f"Received login attempt with username: {username} and password: {password}")
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)
                return JsonResponse(
                    {
                        "message": "Login successful",
                        "status": "success",
                        "user": {
                            "username": user.username,
                            "email": user.email,
                            "password": user.password,
                            "id": user.id
                            }
                    }, status=200)
            else:
                return JsonResponse(
                    {
                        "error": "Invalid credentials",
                        "status": "error"
                    }, status=401)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON", "status": "error"}, status=400)

    return JsonResponse({"error": "Invalid method", "status": "error"}, status=405)


@csrf_exempt
def register_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")
            email = data.get("email")
            print(f"Received registration attempt with username: {username} and password: {password}")
            user = User.objects.filter(username=username, email=email).first()
            if user:
                return JsonResponse({"error": "User already exists", "status": "error"}, status=400)
            else:
                User.objects.create_user(username=username, password=password, email=email)
                return JsonResponse(
                    {
                        "message": "Registration successful",
                        "status": "success",
                        "user": {
                            "username": username,
                            "email": email,
                            "id": User.objects.get(username=username).id
                        }
                    }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON", "status": "error"}, status=400)

    return JsonResponse({"error": "Invalid method", "status": "error"}, status=405)

@csrf_exempt
def protected_api(request):
    if request.user.is_authenticated:
        return JsonResponse({"message": "This is a protected API endpoint", "status": "success"}, status=200)
    else:
        return JsonResponse({"error": "Unauthorized", "status": "error"}, status=401)
