import requests
import os

def fetchIp():
    api = os.getenv("IP_API")
    res = requests.get("https://api64.ipify.org/?format=json")
    data = res.json()
    return data