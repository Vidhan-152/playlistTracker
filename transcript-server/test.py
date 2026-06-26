import requests

url = "https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en"

r = requests.get(url)

print("Status:", r.status_code)
print("Length:", len(r.text))
print("First 300 chars:")
print(r.text[:300])