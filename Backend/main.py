from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

IBM_API_KEY = os.getenv("IBM_API_KEY")
IBM_REGION = os.getenv("IBM_REGION")
MODEL_ID = os.getenv("MODEL_ID")

IAM_URL = "https://iam.cloud.ibm.com/identity/token"
WATSONX_URL = f"https://{IBM_REGION}.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29"

class ChatRequest(BaseModel):
    message: str
    context: dict

def get_iam_token():
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": IBM_API_KEY
    }
    response = requests.post(IAM_URL, headers=headers, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def build_prompt(message, context):
    return f"""
You are MedAI, an educational healthcare AI assistant.

Context:
Country: {context.get('country')}
Age: {context.get('age')}
Sex: {context.get('sex')}
Patient history: {context.get('history')}

User question:
{message}

Rules:
- Do not diagnose
- Do not prescribe
- Provide educational and safety-focused information only
"""

@app.post("/chat")
def chat(req: ChatRequest):
    token = get_iam_token()

    payload = {
        "model_id": MODEL_ID,
        "messages": [
            {"role": "user", "content": build_prompt(req.message, req.context)}
        ],
        "parameters": {
            "temperature": 0.4,
            "max_new_tokens": 300
        }
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(WATSONX_URL, headers=headers, json=payload)
    response.raise_for_status()

    ai_message = response.json()["choices"][0]["message"]["content"]

    return {"reply": ai_message}
