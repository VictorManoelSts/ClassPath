import requests
from flask import current_app
from requests_toolbelt import MultipartEncoder


def _get_url(endpoint):
    """Função utilitária para montar a URL base do FastAPI"""
    return current_app.config["URL_FASTAPI"].rstrip("/") + endpoint


def _authorization():
    return {"Authorization": "Bearer " + current_app.config["MATERIALS_ADMIN_TOKEN"]}


def upload_material(disciplina_id, file_obj):
    """
    file_obj: É o objeto de arquivo bruto que receberemos do Flask (request.files['file']).
    """
    form = MultipartEncoder(fields={
        "disciplina": str(disciplina_id),
        "file": (file_obj.filename, file_obj.stream, file_obj.content_type),
    })
    response = requests.post(_get_url('/materiais'), data=form, timeout=(3, 30),
                             headers={**_authorization(), "Content-Type": form.content_type},
                             allow_redirects=False)
    response.raise_for_status()
    return response.json()


def listar_materiais(disciplina_id=None):
    url = _get_url('/materiais')
    params = {}
    if disciplina_id:
        # A chave deve ser exatamente 'disciplina' para o FastAPI reconhecer
        params['disciplina'] = str(disciplina_id)

    response = requests.get(url, params=params, timeout=(3, 10))
    response.raise_for_status()
    return response.json()

def baixar_material(file_id):
    url = _get_url(f'/materiais/{file_id}')
    # stream=True impede que o Flask jogue o PDF inteiro na memória RAM de uma vez
    response = requests.get(url, stream=True, timeout=(3, 30))
    response.raise_for_status()
    return response

def deletar_material(file_id):
    """Envia a requisição de deleção para o FastAPI"""
    url = _get_url(f'/materiais/{file_id}')
    response = requests.delete(url, timeout=(3, 10), headers=_authorization(), allow_redirects=False)
    response.raise_for_status()
    # Retorna o JSON da resposta (se houver) ou um dicionário vazio
    return response.json() if response.text else {}
