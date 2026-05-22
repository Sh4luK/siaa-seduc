import requests

def test_login():
    req = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/login/"
    data = { "username": "iraildess", "password": "iraildes" }

    res = requests.post(req, data=data)
    print(res.status_code)
    print(res.text)
test_login()