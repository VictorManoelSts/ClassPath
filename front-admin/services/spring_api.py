import requests
from flask import current_app

TIMEOUT = (3, 10)

def _get_url(endpoint):
    return current_app.config["URL_SPRING_BOOT"].rstrip("/") + endpoint

# --- DISCIPLINAS ---
def _write(method, endpoint, **kwargs):
    token = current_app.config["ACADEMIC_ADMIN_TOKEN"]
    response = requests.request(method, _get_url(endpoint), **kwargs,
                                headers={"Authorization": f"Bearer {token}"},
                                timeout=TIMEOUT, allow_redirects=False)
    response.raise_for_status()
    if response.is_redirect:
        raise requests.HTTPError("Redirecionamento inesperado", response=response)
    return response.json() if response.content else {}


def listar_disciplinas():
    response = requests.get(_get_url('/disciplinas'), timeout=TIMEOUT, allow_redirects=False)
    response.raise_for_status()
    return response.json()

def criar_disciplina(payload):
    # payload esperado: { "nome": "String", "professor": "String" }
    return _write("POST", '/disciplinas', json=payload)

# --- HORÁRIOS ---
def listar_horarios():
    response = requests.get(_get_url('/horarios'), timeout=TIMEOUT, allow_redirects=False)
    response.raise_for_status()
    return response.json()

def criar_horario(payload):
    # payload esperado: { "disciplinaId": Long, "diaSemana": "String", ... }
    return _write("POST", '/horarios', json=payload)

# --- AVISOS ---
def listar_avisos():
    response = requests.get(_get_url('/avisos'), timeout=TIMEOUT, allow_redirects=False)
    response.raise_for_status()
    return response.json()

def criar_aviso(payload):
    # payload esperado: { "titulo": "String", "descricao": "String", "disciplinaId": Long, "dataPublicacao": "String" }
    return _write("POST", '/avisos', json=payload)

# Atualizar e Deletar Disciplinas
def atualizar_disciplina(id, payload):
    return _write("PUT", f'/disciplinas/{id}', json=payload)

def deletar_disciplina(id):
    return _write("DELETE", f'/disciplinas/{id}')

# Atualizar e Deletar Horários
def atualizar_horario(id, payload):
    return _write("PUT", f'/horarios/{id}', json=payload)

def deletar_horario(id):
    return _write("DELETE", f'/horarios/{id}')

# Atualizar e Deletar Avisos
def atualizar_aviso(id, payload):
    return _write("PUT", f'/avisos/{id}', json=payload)

def deletar_aviso(id):
    return _write("DELETE", f'/avisos/{id}')
