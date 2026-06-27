import requests
def get_ip():
    url = "http://ip-api.com/json/"
    get = requests.get(url).json()
    ip = get["query"]

    return ip
