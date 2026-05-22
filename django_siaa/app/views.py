from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, request
from django.views.decorators.csrf import csrf_exempt
from .models import User
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
            return JsonResponse({"username": username, "password": password})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)
