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
        # username = request.POST.get("username")
        # password = request.POST.get("password")
        # print(f"Received login attempt with username: {username} and password: {password}")
        # return JsonResponse(
        #     {
        #         "username": username,
        #         "password": password
        #     }, status=200
        # )
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")
            print(f"Received login attempt with username: {username} and password: {password}")
            return JsonResponse(
                {
                    "username": username,
                    "password": password
                }, status=200
            )
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    # return JsonResponse({"error": "Invalid method"}, status=405)
