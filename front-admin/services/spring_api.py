import requests
from config import Config

def _get_url(endpoint):
    """Função utilitária para montar a URL base do Spring Boot"""
    return f"{Config.URL_SPRING_BOOT}{endpoint}"

# --- DISCIPLINAS ---
def listar_disciplinas():
    response = requests.get(_get_url('/disciplinas'))
    response.raise_for_status() # Lança exceção se o Spring retornar erro 4xx ou 5xx
    return response.json()

def criar_disciplina(payload):
    # payload esperado: { "nome": "String", "professor": "String" }
    response = requests.post(_get_url('/disciplinas'), json=payload)
    response.raise_for_status()
    return response.json()

# --- HORÁRIOS ---
def listar_horarios():
    response = requests.get(_get_url('/horarios'))
    response.raise_for_status()
    return response.json()

def criar_horario(payload):
    # payload esperado: { "disciplinaId": Long, "diaSemana": "String", ... }
    response = requests.post(_get_url('/horarios'), json=payload)
    response.raise_for_status()
    return response.json()

# --- AVISOS ---
def listar_avisos():
    response = requests.get(_get_url('/avisos'))
    response.raise_for_status()
    return response.json()

def criar_aviso(payload):
    # payload esperado: { "titulo": "String", "descricao": "String", "disciplinaId": Long, "dataPublicacao": "String" }
    response = requests.post(_get_url('/avisos'), json=payload)
    response.raise_for_status()
    return response.json()

# Atualizar e Deletar Disciplinas
def atualizar_disciplina(id, payload):
    response = requests.put(_get_url(f'/disciplinas/{id}'), json=payload)
    response.raise_for_status()
    return response.json() if response.text else {}

def deletar_disciplina(id):
    response = requests.delete(_get_url(f'/disciplinas/{id}'))
    response.raise_for_status()
    return response.json() if response.text else {}

# Atualizar e Deletar Horários
def atualizar_horario(id, payload):
    response = requests.put(_get_url(f'/horarios/{id}'), json=payload)
    response.raise_for_status()
    return response.json() if response.text else {}

def deletar_horario(id):
    response = requests.delete(_get_url(f'/horarios/{id}'))
    response.raise_for_status()
    return response.json() if response.text else {}

# Atualizar e Deletar Avisos
def atualizar_aviso(id, payload):
    response = requests.put(_get_url(f'/avisos/{id}'), json=payload)
    response.raise_for_status()
    return response.json() if response.text else {}

def deletar_aviso(id):
    response = requests.delete(_get_url(f'/avisos/{id}'))
    response.raise_for_status()
    return response.json() if response.text else {}