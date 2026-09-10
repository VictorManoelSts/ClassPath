import requests
from config import Config


def _get_url(endpoint):
    """Função utilitária para montar a URL base do FastAPI"""
    return f"{Config.URL_FASTAPI}{endpoint}"


def upload_material(disciplina_id, file_obj):
    """
    file_obj: É o objeto de arquivo bruto que receberemos do Flask (request.files['file']).
    """
    # O requests espera um dicionário para 'files' no formato:
    # 'nome_do_campo': (nome_do_arquivo, conteudo_em_bytes, tipo_mime)
    files = {
        'file': (file_obj.filename, file_obj.read(), file_obj.content_type)
    }

    # Os metadados que acompanham o arquivo vão no dicionário 'data'
    data = {
        'disciplina': str(disciplina_id)
    }

    response = requests.post(_get_url('/materiais'), files=files, data=data)
    response.raise_for_status()
    return response.json()


def listar_materiais(disciplina_id=None):
    url = _get_url('/materiais')
    params = {}
    if disciplina_id:
        # A chave deve ser exatamente 'disciplina' para o FastAPI reconhecer
        params['disciplina'] = str(disciplina_id)

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def baixar_material(file_id):
    url = _get_url(f'/materiais/{file_id}')
    # stream=True impede que o Flask jogue o PDF inteiro na memória RAM de uma vez
    response = requests.get(url, stream=True)
    response.raise_for_status()
    return response

def deletar_material(file_id):
    """Envia a requisição de deleção para o FastAPI"""
    url = _get_url(f'/materiais/{file_id}')
    response = requests.delete(url)
    response.raise_for_status()
    # Retorna o JSON da resposta (se houver) ou um dicionário vazio
    return response.json() if response.text else {}