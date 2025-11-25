import jwt
import time

TEAM_ID = "BJ345NMP76"             # <-- reemplaza esto
CLIENT_ID = "cl.visitme.app"       # <-- tu Service ID de Apple
KEY_ID = "4QYCZGS363"               # <-- el ID de la Key que descargaste
PRIVATE_KEY_PATH = "AuthKey_4QYCZGS363.p8"    # <-- archivo .p8 en misma carpeta

with open(PRIVATE_KEY_PATH, "r") as f:
    private_key = f.read()

now = int(time.time())

payload = {
    "iss": TEAM_ID,
    "iat": now,
    "exp": now + 15777000,  # 6 meses
    "aud": "https://appleid.apple.com",
    "sub": CLIENT_ID,
}

headers = {
    "kid": KEY_ID,
    "alg": "ES256"
}

token = jwt.encode(
    payload,
    private_key,
    algorithm="ES256",
    headers=headers,
)

print("\n===== APPLE CLIENT SECRET (copy this into Supabase) =====\n")
print(token)
print("\n==========================================================\n")

