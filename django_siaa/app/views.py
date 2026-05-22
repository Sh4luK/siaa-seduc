from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User

@csrf_exempt
def index(request):
    return HttpResponse("Hello, world! This is the SIAA API.")

@csrf_exempt
def login(request):
    if request.method == "POST":
        username = "iraildess" #request.POST.get("username")
        password = "iraildes"
        user = User.objects.filter(username=username, password=password)
        if user.exists():
            return HttpResponse("Login successful!")
        else:
            return HttpResponse("Invalid username or password.")
        print(f"Received login attempt with username: {username} and password: {password}")
    return HttpResponse("Please send a POST request with username and password.")