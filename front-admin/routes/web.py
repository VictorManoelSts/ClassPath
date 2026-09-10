
from flask import Blueprint, render_template, request, jsonify, Response
from services.spring_api import (
    listar_disciplinas, criar_disciplina, atualizar_disciplina, deletar_disciplina,
    listar_horarios, criar_horario, atualizar_horario, deletar_horario,
    listar_avisos, criar_aviso, atualizar_aviso, deletar_aviso
)
from services.fastapi_api import upload_material, listar_materiais, baixar_material
import services.fastapi_api as fastapi_api

web_bp = Blueprint('web', __name__)

# --- ROTA DA INTERFACE ---
@web_bp.route('/')
def index():
    return render_template('index.html')


# --- ROTAS DE API (BFF) ---

# Disciplinas
@web_bp.route('/api/disciplinas', methods=['GET'])
def get_disciplinas():
    try:
        dados = listar_disciplinas()
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/disciplinas', methods=['POST'])
def post_disciplina():
    try:
        payload = request.get_json()
        dados = criar_disciplina(payload)
        return jsonify(dados), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/disciplinas/<int:id>', methods=['PUT'])
def put_disciplina(id):
    try:
        payload = request.get_json()
        dados = atualizar_disciplina(id, payload)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/disciplinas/<int:id>', methods=['DELETE'])
def delete_disciplina(id):
    try:
        dados = deletar_disciplina(id)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Horários
@web_bp.route('/api/horarios', methods=['GET'])
def get_horarios():
    try:
        dados = listar_horarios()
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/horarios', methods=['POST'])
def post_horario():
    try:
        payload = request.get_json()
        dados = criar_horario(payload)
        return jsonify(dados), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/horarios/<int:id>', methods=['PUT'])
def put_horario(id):
    try:
        payload = request.get_json()
        dados = atualizar_horario(id, payload)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/horarios/<int:id>', methods=['DELETE'])
def delete_horario(id):
    try:
        dados = deletar_horario(id)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Avisos
@web_bp.route('/api/avisos', methods=['GET'])
def get_avisos():
    try:
        dados = listar_avisos()
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/avisos', methods=['POST'])
def post_aviso():
    try:
        payload = request.get_json()
        dados = criar_aviso(payload)
        return jsonify(dados), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/avisos/<int:id>', methods=['PUT'])
def put_aviso(id):
    try:
        payload = request.get_json()
        dados = atualizar_aviso(id, payload)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/avisos/<int:id>', methods=['DELETE'])
def delete_aviso(id):
    try:
        dados = deletar_aviso(id)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Materiais (FastAPI / MongoDB)
@web_bp.route('/api/materiais', methods=['GET'])
def get_materiais():
    try:
        # O front-end envia o filtro via querystring (ex: /api/materiais?disciplinaId=1)
        disciplina_id = request.args.get('disciplinaId')
        dados = listar_materiais(disciplina_id)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/api/materiais', methods=['POST'])
def post_material():
    try:
        if 'file' not in request.files:
            return jsonify({"erro": "Nenhum arquivo enviado na requisição."}), 400

        file_obj = request.files['file']
        disciplina_id = request.form.get('disciplina_id')

        if not disciplina_id:
            return jsonify({"erro": "O ID da disciplina é obrigatório."}), 400

        dados = upload_material(disciplina_id, file_obj)
        return jsonify(dados), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@web_bp.route('/api/materiais/<file_id>', methods=['GET'])
def get_download_material(file_id):
    try:
        resp_fastapi = baixar_material(file_id)

        # O Flask pega a resposta do FastAPI e cria um gerador de streaming para o navegador
        def gerar_chunks():
            for chunk in resp_fastapi.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        # Pega os cabeçalhos originais (Content-Type e Content-Disposition) que o FastAPI enviou
        headers = {
            'Content-Type': resp_fastapi.headers.get('content-type', 'application/pdf'),
            'Content-Disposition': resp_fastapi.headers.get('content-disposition',
                                                            f'attachment; filename="{file_id}.pdf"')
        }

        return Response(gerar_chunks(), headers=headers)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@web_bp.route('/materiais/<file_id>', methods=['DELETE'])
def route_deletar_material(file_id):
    try:
        fastapi_api.deletar_material(file_id)
        return jsonify({"mensagem": "Material deletado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": f"Falha ao deletar: {str(e)}"}), 500


@web_bp.route('/materiais/<file_id>', methods=['GET'])
def route_baixar_material(file_id):
    try:
        # Faz a requisição para o FastAPI (que retorna um stream)
        fastapi_response = fastapi_api.baixar_material(file_id)

        # Extrai os cabeçalhos originais que o FastAPI enviou (tipo e nome do arquivo)
        content_type = fastapi_response.headers.get('Content-Type', 'application/pdf')
        content_disposition = fastapi_response.headers.get(
            'Content-Disposition',
            f'attachment; filename="material_{file_id}.pdf"'
        )

        # Repassa o streaming para o front-end em blocos de 8KB
        return Response(
            fastapi_response.iter_content(chunk_size=8192),
            content_type=content_type,
            headers={'Content-Disposition': content_disposition}
        )

    except Exception as e:
        return {"erro": f"Falha ao baixar o arquivo: {str(e)}"}, 500