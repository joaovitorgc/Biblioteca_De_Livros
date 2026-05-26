import datetime
import random
from flask_bcrypt import generate_password_hash
from flask_bcrypt import check_password_hash
from datetime import datetime, timedelta

from flask import send_from_directory
from funcao import decodificar_token
from funcao import encode_password
from funcao import validar_senha
from funcao import enviando_email
from flask import make_response
from flask import jsonify
from funcao import gerar_token
from funcao import email_reserva_confirmada
from funcao import email_multa_atraso
from fpdf import FPDF
from flask import send_file

import qrcode
import base64
from io import BytesIO

import threading
from flask import request
from main import app, con
from funcao import (
    gerar_payload_pix,
    format_field,
    crc16)

# from flask import Flask

import secrets
import os.path

import jwt
import os



@app.route("/cadastro", methods=['POST'])
def cadastro():
    try:
        cur = con.cursor()
        nome = request.form['nome']
        email = request.form['email']
        senha = request.form['senha']
        confirmar_senha = request.form['confirmar_senha']
        imagem = request.files.get('imagem')

        if not(nome and email and senha and confirmar_senha):
            return jsonify({"error": "Todos os campos devem estar preenchidos"}), 400

        email = email.replace(' ', '').lower()
        nome = nome.strip()

        validada = validar_senha(senha)
        if not validada:
            return jsonify({"error": "A senha não segue os padrões de segurança"}), 400
        cur.execute("select 1 from usuarios where email = ?", (email,))
        if senha != confirmar_senha:
            return jsonify({"error": "As senhas não coincidem"}), 400
        if cur.fetchone():
            return jsonify({"error":"Email já cadastrado"}), 400
        codigo = f"{random.randint(000000, 999999):06d}"
        senha_hash = encode_password(senha)
        cur.execute("""insert into usuarios(nome, email, senha, codigo, tipo, tentativas) values (?, ?, ?, ?, ?, 0) RETURNING id_usuario""",
                    (nome, email, senha_hash, codigo, 1, 0))
        id_usuario = cur.fetchone()[0]
        con.commit()

        if imagem:
            nome_imagem = f"{id_usuario}.jpg"
            caminho_imagem_destino = os.path.join(app.config['UPLOAD_FOLDER'], "uploads/Usuarios")
            os.makedirs(caminho_imagem_destino, exist_ok=True)
            caminho_imagem = os.path.join(caminho_imagem_destino, nome_imagem)
            imagem.save(caminho_imagem)

        try:
            assunto = 'Confirmação de Email'
            mensagem = f'Confirme aqui seu email: {codigo}'
            thread = threading.Thread(target=enviando_email,
                                      args=(email, assunto, mensagem))
            thread.start()
            return jsonify({"mensagem": "Email enviado com sucesso!"}), 200
        except Exception as e:
            return jsonify({"mensagem": f"Erro ao enviar email {e}!"}), 200
    except Exception as e:
        print(f"Houve um erro: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        cur.close()

@app.route("/verificar_email", methods=['POST'])
def verificar_email():
    cur = con.cursor()
    try:
        dados = request.get_json()
        email = dados.get('email')
        codigo = dados.get('codigo')

        if not email or not codigo:
            return jsonify({'error': 'Email e código são obrigatórios.'}), 400

        email = email.replace(' ', '').lower()

        cur.execute("""
                    SELECT id_usuario, codigo
                    FROM usuarios
                    WHERE email = ?
                    """, (email,))
        usuario = cur.fetchone()

        if not usuario:
            return jsonify({'error': 'Usuário não encontrado.'}), 404

        id_usuario = usuario[0]
        codigo_banco = usuario[1]

        if int(codigo) != int(codigo_banco):
            return jsonify({'error': 'Código inválido.'}), 400

        cur.execute("""
                    UPDATE usuarios
                    SET email_verificado = 1,
                        codigo = NULL
                    WHERE id_usuario = ?
                    """, (id_usuario,))
        con.commit()

        return jsonify({'message': 'Email validado com sucesso.'}), 200

    except Exception as e:
        print(f"Erro ao validar email: {str(e)}")
        return jsonify({'error': f'Erro ao validar email.'}), 500

    finally:
        cur.close()

@app.route("/login", methods=['POST'])
def login():
    cursor = con.cursor()
    try:
        dados = request.get_json()
        email = dados.get('email').lower()
        senha = dados.get('senha')

        if not email or not senha:
            return jsonify({'error': 'E-mail e senha são obrigatórios.'}), 400

        cursor.execute("""
            SELECT senha, id_usuario, nome, situacao, COALESCE(tentativas,0), tipo, email, email_verificado
            FROM usuarios
            WHERE email = ?
        """, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({'error': 'Usuário não encontrado.'}), 404
        print(usuario[4])

        senha_hash = usuario[0]
        id_usuario = usuario[1]
        nome = usuario[2]
        situacao = usuario[3]
        tentativas = usuario[4]
        tipo = usuario[5]
        email = usuario[6]
        email_verificado = usuario[7]

        if email_verificado == 0:
            return jsonify({'error': 'Usuário nao confirmou email. Contate o administrador.'}), 403

        if situacao == 1:
            return jsonify({'error': 'Usuário está inativo. Contate o administrador.'}), 403

        if check_password_hash(senha_hash, senha):
            if tipo != 0:
                cursor.execute("""
                               UPDATE usuarios SET tentativas = 0 WHERE id_usuario = ?
                               """, (id_usuario,))
                con.commit()

            payload = {
                'id_usuario': id_usuario,
                'nome': nome,
                'email': email,
                'tipo': tipo
            }

            token = gerar_token(payload)

            resp = make_response(jsonify({
                'mensagem': 'Logado com sucesso',
                'usuario': {
                    'id_usuario': id_usuario,
                    'nome': nome,
                    'email': email,
                    'tipo': tipo
                }
            }), 200)

            resp.set_cookie("access_token", token,
                                httponly=True,
                                secure=False,
                                samesite='Lax'
                            )

            return resp

        if tentativas < 2 and tipo != 0:
            cursor.execute("""
                UPDATE usuarios
                SET tentativas = COALESCE(tentativas, 0) + 1
                WHERE id_usuario = ?
            """, (id_usuario,))
            con.commit()
            return jsonify({'error': 'E-mail ou senha incorretos. Tente novamente.'}), 401

        if tentativas == 2 and tipo != 0:
            cursor.execute("""
                UPDATE usuarios
                SET tentativas = 3, situacao = 1
                WHERE id_usuario = ?
            """, (id_usuario,))
            con.commit()
            return jsonify({
                'error': 'Conta bloqueada após 3 tentativas. Contate o administrador.'
            }), 403

        return jsonify({'error': 'E-mail ou senha incorretos. Tente novamente.'}), 401

    except Exception as e:
        print(str(e))
        return jsonify({'error': f'Erro ao realizar login.'}), 500

    finally:
        cursor.close()

@app.route('/logout', methods=['POST'])
def logout():
    resp = make_response(jsonify({"mensagem": "Logout realizado com sucesso"}), 200)

    resp.set_cookie(
        "access_token",
        "",
        expires=0,
        max_age=0
    )

    return resp

@app.route('/editar_usuario/<int:id>', methods=['PUT'])
def editar_usuario(id):

    token = request.cookies.get("access_token")
    print(token)

    if not token:
        return jsonify({
            "error": "Token de autenticação necessário."
        }), 401

    try:

        payload = decodificar_token(token)

        id_usuario = payload['id_usuario']
        tipo = payload['tipo']

        if id_usuario != id and tipo != 0:

            return jsonify({
                "error": "Você não pode editar outro usuário."
            }), 401

    except jwt.ExpiredSignatureError:

        return jsonify({
            "error": "Token expirado."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "error": "Token inválido."
        }), 401

    cur = con.cursor()

    try:

        cur.execute(
            'SELECT 1 FROM usuarios WHERE id_usuario = ?',
            (id,)
        )

        if not cur.fetchone():

            return jsonify({
                "error": "Usuário não encontrado."
            }), 404

        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')

        imagem = request.files.get('imagem')

        if not nome or not email or not senha:

            return jsonify({
                "error": "Todos os campos são obrigatórios."
            }), 400

        email = email.strip().lower()

        cur.execute(
            '''
            SELECT 1
            FROM usuarios
            WHERE email = ?
            AND id_usuario != ?
            ''',
            (email, id)
        )

        if cur.fetchone():

            return jsonify({
                "error": "Email já cadastrado."
            }), 400

        if not validar_senha(senha):

            return jsonify({
                "error": "Senha inválida."
            }), 400

        senha_hash = generate_password_hash(senha).decode('utf-8')

        cur.execute(
            '''
            UPDATE usuarios
            SET
                nome = ?,
                email = ?,
                senha = ?
            WHERE id_usuario = ?
            ''',
            (
                nome,
                email,
                senha_hash,
                id
            )
        )

        con.commit()

        if imagem:

            nome_imagem = f"{id}.jpg"

            caminho_imagem_destino = os.path.join(
                app.config['UPLOAD_FOLDER'],
                "uploads",
                "Usuarios"
            )

            os.makedirs(
                caminho_imagem_destino,
                exist_ok=True
            )

            caminho_imagem = os.path.join(
                caminho_imagem_destino,
                nome_imagem
            )

            imagem.save(caminho_imagem)

        return jsonify({

            "message": "Usuário atualizado com sucesso.",

            "usuario": {
                "id": id,
                "nome": nome,
                "email": email
            }

        }), 200

    except Exception as e:

        print(e)

        con.rollback()

        return jsonify({
            "error": "Erro ao atualizar usuário."
        }), 500

    finally:
        cur.close()

@app.route('/deletar_usuario/<int:id>', methods=['DELETE'])
def deletar_usuario(id):
    try:
        token = request.cookies.get('access_token')

        if not token:
            return jsonify({"error": "Token necessário"}), 401

        payload = decodificar_token(token)

        if payload['tipo'] != 0:
            return jsonify({"error": "Acesso negado. Apenas administradores podem acessar esse recurso"}), 403

        cur = con.cursor()

        cur.execute('SELECT 1 FROM usuarios WHERE id_usuario = ?', (id,))
        if not cur.fetchone():
            return jsonify({"error": "Usuário não encontrado"}), 404

        cur.execute("DELETE FROM usuarios WHERE id_usuario = ?", (id,))
        con.commit()

        return jsonify({"message": "Usuário excluído com sucesso"})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalid"}), 401
    except Exception as e:
        con.rollback()
        return jsonify({"error": "Internal server error"}), 500

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory('uploads', filename)

@app.route('/recuperar_senha', methods=['POST'])
def recuperar_senha():
    cur = con.cursor()
    try:
        dados = request.get_json(silent=True) or {}

        email = (dados.get('email') or '').strip().lower()
        codigo = dados.get('codigo')
        nova_senha = dados.get('nova_senha')

        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400

        # --- ETAPA 1: Enviar o código para o email (tem email, mas não tem código nem senha) ---
        if not codigo and not nova_senha:
            cur.execute("""
                SELECT id_usuario
                FROM usuarios
                WHERE email = ?
            """, (email,))
            if not cur.fetchone():
                return jsonify({'error': 'Usuário não encontrado'}), 404

            codigo = f"{secrets.randbelow(1000000):06d}"

            cur.execute("""
                UPDATE usuarios
                SET codigo = ?
                WHERE email = ?
            """, (codigo, email))
            con.commit()

            threading.Thread(
                target=enviando_email,
                args=(email, "Recuperação de senha", f"Código: {codigo}"),
                daemon=True
            ).start()

            return jsonify({"mensagem": "Código enviado"}), 200

        # --- ETAPA 2 (NOVA): Verificar apenas o código (tem email e código, mas não tem senha) ---
        if codigo and not nova_senha:
            cur.execute("""
                SELECT codigo
                FROM usuarios
                WHERE email = ?
            """, (email,))
            usuario = cur.fetchone()

            if not usuario:
                return jsonify({'error': 'Usuário não encontrado'}), 404

            codigo_banco = usuario[0]

            if str(codigo_banco) != str(codigo):
                return jsonify({'error': 'Código inválido'}), 400

            return jsonify({"mensagem": "Código correto"}), 200

        # --- ETAPA 3: Redefinir a senha final (tem email, código e a nova senha) ---
        if codigo and nova_senha:
            cur.execute("""
                SELECT id_usuario, senha, senha_um, senha_dois, senha_tres, codigo
                FROM usuarios
                WHERE email = ?
            """, (email,))
            usuario = cur.fetchone()

            if not usuario:
                return jsonify({'error': 'Usuário não encontrado'}), 404

            id_usuario = usuario[0]
            senha_atual = usuario[1]
            senha_um = usuario[2]
            senha_dois = usuario[3]
            senha_tres = usuario[4]
            codigo_banco = usuario[5]

            if str(codigo_banco) != str(codigo):
                return jsonify({'error': 'Código inválido'}), 400

            if not validar_senha(nova_senha):
                return jsonify({"error": "A senha não segue nossos padrões de segurança"}), 400

            historico = [senha_atual, senha_um, senha_dois, senha_tres]
            for senha_hash in historico:
                if not senha_hash:
                    continue
                try:
                    if check_password_hash(senha_hash, nova_senha):
                        return jsonify({"error": "Não é permitido reutilizar as últimas 3 senhas"}), 400
                except ValueError:
                    continue

            nova_hash = generate_password_hash(nova_senha)

            cur.execute("""
                UPDATE usuarios
                SET senha = ?,
                    senha_um = ?,
                    senha_dois = ?,
                    senha_tres = ?,
                    codigo = NULL
                WHERE id_usuario = ?
            """, (
                nova_hash,
                nova_hash,
                senha_um,
                senha_dois,
                id_usuario
            ))
            con.commit()

            return jsonify({"mensagem": "Senha redefinida com sucesso"}), 200

        return jsonify({'error': 'Dados inválidos'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/listar_usuarios', methods=['GET'])
def listar_usuarios():
    cur = con.cursor()

    try:
        cur.execute("SELECT id_usuario, nome, email FROM usuarios")
        usuarios = cur.fetchall()

        cur.execute("SELECT count(*) FROM usuarios")
        total_usuarios = cur.fetchone()[0]

        lista_usuarios = []

        for usuario in usuarios:
            lista_usuarios.append({
                "id": usuario[0],
                "nome": usuario[1],
                "email": usuario[2]
            })

        return jsonify({
            "usuarios": lista_usuarios,
            "total_usuarios": total_usuarios
        })

    except Exception as e:
        return jsonify({
            'error': 'Erro ao conectar com a API: ' + str(e)
        }), 500

    finally:
        cur.close()


@app.route("/cadastrar_livro", methods=['POST'])
def cadastrar_livro():

    cursor = con.cursor()

    try:

        titulo = request.form.get('titulo')
        autor = request.form.get('autor')
        genero = request.form.get('genero')
        ano_publicacao = request.form.get('ano_publicacao')
        estoque = request.form.get('estoque')
        descricao = request.form.get('descricao')

        imagem = request.files.get('imagem')

        if (
            not titulo
            or not autor
            or not genero
            or not ano_publicacao
            or not estoque
            or not descricao
            or not imagem
        ):

            return jsonify({
                'error': 'Todos os campos são obrigatórios.'
            }), 400

        cursor.execute("""
            INSERT INTO livro (

                titulo,
                autor,
                genero,
                ano_publicacao,
                estoque,
                descricao

            )

            VALUES (?, ?, ?, ?, ?, ?)

            RETURNING id_livro

        """, (

            titulo,
            autor,
            genero,
            ano_publicacao,
            estoque,
            descricao

        ))

        id_livro = cursor.fetchone()[0]

        con.commit()

        if imagem:

            nome_imagem = f"{id_livro}.jpg"

            caminho_imagem_destino = os.path.join(
                app.config['UPLOAD_FOLDER'],
                "uploads",
                "Livros"
            )

            os.makedirs(
                caminho_imagem_destino,
                exist_ok=True
            )

            caminho_imagem = os.path.join(
                caminho_imagem_destino,
                nome_imagem
            )

            imagem.save(caminho_imagem)

        return jsonify({

            'mensagem':
                'Livro cadastrado com sucesso!',

            'livro': {
                'titulo': titulo,
                'autor': autor,
                'genero': genero,
                'ano_publicacao': ano_publicacao,
                'estoque': estoque,
                'descricao': descricao
            }
        }), 201
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({
            'error': 'Erro ao cadastrar o livro.'
        }), 500
    finally:
        cursor.close()

@app.route('/listar_livros', methods=['GET'])
def listar_livros():
    cur = con.cursor()
    try:
        cur.execute("SELECT id_livro, titulo, autor, genero, ano_publicacao, estoque FROM livro")
        livros = cur.fetchall()

        cur.execute("SELECT count(*) FROM livro")
        total_livros = cur.fetchone()[0]

        lista_livros = []
        for livro in livros:
            lista_livros.append({
                "id_livro": livro[0],
                "titulo": livro[1],
                "autor": livro[2],
                "genero": livro[3],
                "ano_publicacao": livro[4],
                "estoque": livro[5],
            })

        return jsonify({
            "livros": lista_livros,
            "total_livros": total_livros
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()

@app.route('/uploads/livros/<int:id>', methods=['GET'])
def imagem_livro(id):
    try:
        pasta_uploads = os.path.join(app.root_path, 'uploads', 'Livros')

        nome_arquivo = f"{id}.jpg"

        caminho_arquivo = os.path.join(pasta_uploads, nome_arquivo)

        if not os.path.exists(caminho_arquivo):
            return jsonify({
                "erro": "Imagem não encontrada"
            }), 404

        return send_from_directory(
            directory=pasta_uploads,
            path=nome_arquivo,
            mimetype='image/jpeg'
        )

    except Exception as e:
        return jsonify({
            "erro": str(e)
        }), 500

@app.route('/deletar_livro/<int:id>', methods=['DELETE'])
def deletar_livro(id):
    try:
        token = request.cookies.get('access_token')

        if not token:
            return jsonify({"error": "Token necessário"}), 401

        payload = decodificar_token(token)

        if payload['tipo'] != 0:
            return jsonify({"error": "Acesso negado. Apenas administradores podem acessar esse recurso"}), 403

        cur = con.cursor()

        cur.execute('SELECT 1 FROM livro WHERE id_livro = ?', (id,))
        if not cur.fetchone():
            return jsonify({"error": "Livro não encontrado"}), 404

        cur.execute("DELETE FROM livro WHERE id_livro = ?", (id,))
        con.commit()

        return jsonify({"message": "Livro excluído com sucesso"})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalid"}), 401
    except Exception as e:
        con.rollback()
        return jsonify({"error": "Internal server error"}), 500


@app.route("/editar_livro/<int:id_livro>", methods=['PUT'])
def editar_livro(id_livro):

    cursor = con.cursor()

    try:

        titulo = request.form.get('titulo')
        autor = request.form.get('autor')
        genero = request.form.get('genero')
        ano_publicacao = request.form.get('ano_publicacao')
        estoque = request.form.get('estoque')
        descricao = request.form.get('descricao')

        imagem = request.files.get('imagem')

        if (
            not titulo
            or not autor
            or not genero
            or not ano_publicacao
            or not estoque
            or not descricao
        ):

            return jsonify({
                'error': 'Todos os campos são obrigatórios.'
            }), 400

        cursor.execute("""
            UPDATE livro
            SET
                titulo = ?,
                autor = ?,
                genero = ?,
                ano_publicacao = ?,
                estoque = ?,
                descricao = ?
            WHERE id_livro = ?
        """, (
            titulo,
            autor,
            genero,
            ano_publicacao,
            estoque,
            descricao,
            id_livro
        ))

        con.commit()

        if imagem:

            nome_imagem = f"{id_livro}.jpg"

            caminho_imagem_destino = os.path.join(
                app.config['UPLOAD_FOLDER'],
                "uploads",
                "Livros"
            )

            os.makedirs(caminho_imagem_destino, exist_ok=True)

            caminho_imagem = os.path.join(
                caminho_imagem_destino,
                nome_imagem
            )

            imagem.save(caminho_imagem)

        return jsonify({
            'mensagem': 'Livro atualizado com sucesso!'
        }), 200

    except Exception as e:

        print(e)

        con.rollback()

        return jsonify({
            'error': 'Erro ao editar o livro.'
        }), 500

    finally:

        cursor.close()



@app.route("/emprestimos", methods=["POST"])
def realizar_emprestimo():

    cursor = con.cursor()

    try:

        dados = request.get_json()

        id_livro = dados.get("id_livro")

        id_usuario = dados.get("id_usuario")

        if not id_livro or not id_usuario:

            return jsonify({
                "erro": True,
                "mensagem": "Dados inválidos."
            }), 400

        # VERIFICA SE O USUÁRIO
        # JÁ POSSUI ESSE LIVRO

        cursor.execute("""

            SELECT ID_EMPRESTIMO

            FROM EMPRESTIMOS

            WHERE
                ID_USUARIO = ?
                AND ID_LIVRO = ?
                AND STATUS IN (
                    'RESERVADO',
                    'RETIRADO'
                )

        """, (
            id_usuario,
            id_livro
        ))

        reserva_ativa = cursor.fetchone()

        if reserva_ativa:

            return jsonify({
                "erro": True,
                "mensagem":
                    "Você já possui esse livro reservado."
            }), 400

        # VERIFICA ESTOQUE

        cursor.execute("""

            SELECT ESTOQUE

            FROM LIVRO

            WHERE ID_LIVRO = ?

        """, (id_livro,))

        livro = cursor.fetchone()

        if not livro:

            return jsonify({
                "erro": True,
                "mensagem": "Livro não encontrado."
            }), 404

        estoque = livro[0]

        if estoque <= 0:

            return jsonify({
                "erro": True,
                "mensagem": "Livro indisponível."
            }), 400

        # DATAS

        data_reserva = datetime.now().date()

        data_limite_reserva = (
            data_reserva + timedelta(days=1)
        )

        # CRIA RESERVA

        cursor.execute("""

            INSERT INTO EMPRESTIMOS (

                ID_LIVRO,
                ID_USUARIO,
                DATA_EMPRESTIMO,
                DATA_LIMITE_RESERVA,
                STATUS

            )

            VALUES (?, ?, ?, ?, ?)

        """, (

            id_livro,
            id_usuario,
            data_reserva,
            data_limite_reserva,
            'RESERVADO'

        ))

        # DIMINUI ESTOQUE

        cursor.execute("""

            UPDATE LIVRO

            SET ESTOQUE = ESTOQUE - 1

            WHERE ID_LIVRO = ?

        """, (id_livro,))

        con.commit()

        cursor.execute("SELECT email, nome FROM USUARIOS WHERE ID_USUARIO = ?", (id_usuario,))
        dados_usuario = cursor.fetchone()
        email = dados_usuario[0]
        nome = dados_usuario[1]

        cursor.execute("SELECT TITULO FROM LIVRO WHERE ID_LIVRO = ?", (id_livro,))
        titulo = cursor.fetchone()[0]

        threading.Thread(
            target=email_reserva_confirmada,
            args=(
                email,
                nome,
                titulo,
                data_limite_reserva.strftime("%d/%m/%Y às %H:%M")
            ),
            daemon=True
        ).start()

        return jsonify({

            "erro": False,

            "mensagem":
                "Reserva realizada com sucesso.",

            "status":
                "RESERVADO",

            "data_limite_reserva":
                data_limite_reserva.strftime(
                    "%d/%m/%Y"
                )

        }), 201

    except Exception as e:

        print(e)

        con.rollback()

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cursor.close()

@app.route("/verificar-emprestimo/<int:id_usuario>/<int:id_livro>", methods=["GET"])
def verificar_emprestimo(id_usuario, id_livro):

    cursor = con.cursor()

    try:

        cursor.execute("""

            SELECT ID_EMPRESTIMO

            FROM EMPRESTIMOS

            WHERE
                ID_USUARIO = ?
                AND ID_LIVRO = ?
                AND STATUS IN (
                    'RESERVADO',
                    'RETIRADO'
                )

        """, (
            id_usuario,
            id_livro
        ))

        emprestimo = cursor.fetchone()

        return jsonify({
            "emprestado": emprestimo is not None
        })

    except Exception as e:

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cursor.close()


@app.route('/listar_emprestimos', methods=['GET'])
def listar_emprestimos():

    cur = con.cursor()

    try:

        cur.execute("""

            SELECT
                e.ID_EMPRESTIMO,
                e.ID_LIVRO,

                u.NOME,
                u.EMAIL,

                l.ESTOQUE,

                e.DATA_EMPRESTIMO,
                e.DATA_LIMITE_RESERVA,
                e.DATA_RETIRADA,
                e.DATA_DEVOLUCAO_PREVISTA,

                e.STATUS,

                (
                    SELECT COUNT(*)

                    FROM EMPRESTIMOS emp

                    WHERE
                        emp.ID_LIVRO = l.ID_LIVRO
                        AND emp.STATUS IN (
                            'RESERVADO',
                            'RETIRADO'
                        )

                ) AS EMPRESTADOS

            FROM EMPRESTIMOS e

            INNER JOIN USUARIOS u
            ON u.ID_USUARIO = e.ID_USUARIO

            INNER JOIN LIVRO l
            ON l.ID_LIVRO = e.ID_LIVRO

            WHERE e.STATUS IN (
                'RESERVADO',
                'RETIRADO'
            )

            ORDER BY e.ID_EMPRESTIMO DESC

        """)

        emprestimos = cur.fetchall()

        lista_emprestimos = []

        for emprestimo in emprestimos:

            lista_emprestimos.append({

                "id_emprestimo": emprestimo[0],

                "id_livro": emprestimo[1],

                "usuario": emprestimo[2],

                "email": emprestimo[3],

                "estoque": emprestimo[4],

                "data_reserva": (
                    emprestimo[5].strftime("%d/%m/%Y")
                    if emprestimo[5]
                    else ""
                ),

                "DATA_LIMITE_RESERVA": (
                    emprestimo[6].strftime("%d/%m/%Y")
                    if emprestimo[6]
                    else ""
                ),

                "data_retirada": (
                    emprestimo[7].strftime("%d/%m/%Y")
                    if emprestimo[7]
                    else ""
                ),

                "data_devolucao": (
                    emprestimo[8].strftime("%d/%m/%Y")
                    if emprestimo[8]
                    else ""
                ),

                "status": emprestimo[9],

                "emprestados": emprestimo[10]

            })

        return jsonify({
            "emprestimos": lista_emprestimos
        })

    except Exception as e:

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cur.close()


@app.route('/confirmar_retirada/<int:id_emprestimo>', methods=['PUT'])
def confirmar_retirada(id_emprestimo):

    cur = con.cursor()

    try:

        cur.execute("""

            SELECT STATUS

            FROM EMPRESTIMOS

            WHERE ID_EMPRESTIMO = ?

        """, (id_emprestimo,))

        emprestimo = cur.fetchone()

        if not emprestimo:

            return jsonify({
                "erro": True,
                "mensagem": "Reserva não encontrada."
            }), 404

        status = emprestimo[0]

        if status != "RESERVADO":

            return jsonify({
                "erro": True,
                "mensagem":
                    "Somente reservas podem ser retiradas."
            }), 400

        data_retirada = datetime.now().date()

        data_devolucao_prevista = (
            data_retirada + timedelta(days=7)
        )

        cur.execute("""

            UPDATE EMPRESTIMOS

            SET
                STATUS = 'RETIRADO',
                DATA_RETIRADA = ?,
                DATA_DEVOLUCAO_PREVISTA = ?

            WHERE ID_EMPRESTIMO = ?

        """, (

            data_retirada,

            data_devolucao_prevista,

            id_emprestimo

        ))

        con.commit()

        return jsonify({

            "erro": False,

            "mensagem":
                "Retirada confirmada com sucesso."

        })

    except Exception as e:

        con.rollback()

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cur.close()


@app.route('/devolver_livro/<int:id_emprestimo>', methods=['PUT'])
def devolver_livro(id_emprestimo):

    cur = con.cursor()

    try:

        cur.execute("""
            SELECT
                ID_LIVRO,
                STATUS,
                DATA_DEVOLUCAO_PREVISTA
            FROM EMPRESTIMOS
            WHERE ID_EMPRESTIMO = ?
        """, (id_emprestimo,))

        emprestimo = cur.fetchone()

        if not emprestimo:
            return jsonify({
                "erro": True,
                "mensagem": "Reserva não encontrada."
            }), 404

        id_livro = emprestimo[0]
        status = emprestimo[1]
        data_devolucao_prevista = emprestimo[2]

        if status != "RETIRADO":
            return jsonify({
                "erro": True,
                "mensagem": "O livro ainda não foi retirado."
            }), 400

        data_atual = datetime.now().date()
        multa = 0
        dias_atraso = 0

        if data_devolucao_prevista and data_atual > data_devolucao_prevista:
            dias_atraso = (data_atual - data_devolucao_prevista).days
            multa = 10
            multa += 10 * (0.01 * dias_atraso)
            multa = round(multa, 2)

        cur.execute("""
            UPDATE EMPRESTIMOS
            SET
                STATUS = 'DEVOLVIDO',
                DATA_DEVOLUCAO_REAL = CURRENT_DATE,
                MULTA = ?
            WHERE ID_EMPRESTIMO = ?
        """, (multa, id_emprestimo))

        cur.execute("""
            UPDATE LIVRO
            SET ESTOQUE = ESTOQUE + 1
            WHERE ID_LIVRO = ?
        """, (id_livro,))

        con.commit()

        if multa > 0:
            cur.execute("""
                SELECT u.EMAIL, u.NOME, l.TITULO
                FROM EMPRESTIMOS e
                INNER JOIN USUARIOS u ON u.ID_USUARIO = e.ID_USUARIO
                INNER JOIN LIVRO l ON l.ID_LIVRO = e.ID_LIVRO
                WHERE e.ID_EMPRESTIMO = ?
            """, (id_emprestimo,))
            dados = cur.fetchone()

            payload_pix = gerar_payload_pix(
                chave="50625936892",
                nome="BOOKPLUS",
                cidade="BIRIGUI",
                valor=float(multa),
                txid=f"BOOK{id_emprestimo}"
            )

            qr = qrcode.make(payload_pix)
            buffer = BytesIO()
            qr.save(buffer, format="PNG")
            qr_bytes = buffer.getvalue()  # <- bytes puros, não base64

            threading.Thread(
                target=email_multa_atraso,
                args=(dados[0], dados[1], dados[2], dias_atraso, multa, qr_bytes, payload_pix),
                daemon=True
            ).start()

        mensagem = "Livro devolvido com sucesso."
        if multa > 0:
            mensagem += f" Multa por atraso: R$ {multa:.2f} ({dias_atraso} dias de atraso)."

        return jsonify({
            "erro": False,
            "mensagem": mensagem,
            "multa": multa,
            "dias_atraso": dias_atraso
        })

    except Exception as e:
        con.rollback()
        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:
        cur.close()


@app.route('/meus_emprestimos/<int:id_usuario>', methods=['GET'])
def meus_emprestimos(id_usuario):

    cur = con.cursor()

    try:

        cur.execute("""

            SELECT

                e.ID_EMPRESTIMO,

                e.ID_LIVRO,

                l.TITULO,

                l.AUTOR,

                e.DATA_EMPRESTIMO,

                e.DATA_LIMITE_RESERVA,

                e.DATA_RETIRADA,

                e.DATA_DEVOLUCAO_PREVISTA,

                e.STATUS,

                e.MULTA,

                e.MULTA_PAGA

            FROM EMPRESTIMOS e

            INNER JOIN LIVRO l
            ON l.ID_LIVRO = e.ID_LIVRO

            WHERE
                e.ID_USUARIO = ?
                AND (
                    e.STATUS IN (
                        'RESERVADO',
                        'RETIRADO'
                    )

                    OR (
                        e.MULTA > 0
                        AND e.MULTA_PAGA = 0
                    )
                )

            ORDER BY e.ID_EMPRESTIMO DESC

        """, (id_usuario,))

        emprestimos = cur.fetchall()

        lista_emprestimos = []

        for emprestimo in emprestimos:

            lista_emprestimos.append({

                "id_emprestimo": emprestimo[0],

                "id_livro": emprestimo[1],

                "titulo": emprestimo[2],

                "autor": emprestimo[3],

                "data_reserva": (
                    emprestimo[4].strftime("%d/%m/%Y")
                    if emprestimo[4]
                    else ""
                ),

                "DATA_LIMITE_RESERVA": (
                    emprestimo[5].strftime("%d/%m/%Y")
                    if emprestimo[5]
                    else ""
                ),

                "data_retirada": (
                    emprestimo[6].strftime("%d/%m/%Y")
                    if emprestimo[6]
                    else ""
                ),

                "data_devolucao": (
                    emprestimo[7].strftime("%d/%m/%Y")
                    if emprestimo[7]
                    else ""
                ),

                "status": emprestimo[8],

                "multa": float(emprestimo[9])
                if emprestimo[9]
                else 0,

                "multa_paga": emprestimo[10]

            })

        return jsonify({
            "erro": False,
            "emprestimos": lista_emprestimos
        })

    except Exception as e:

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cur.close()

@app.route('/livro/<int:id_livro>', methods=['GET'])
def buscar_livro(id_livro):

    cur = con.cursor()

    try:

        cur.execute("""

            SELECT
                ID_LIVRO,
                TITULO,
                AUTOR,
                GENERO,
                ANO_PUBLICACAO,
                ESTOQUE,
                DESCRICAO

            FROM LIVRO

            WHERE ID_LIVRO = ?

        """, (id_livro,))

        livro = cur.fetchone()

        if not livro:

            return jsonify({
                "erro": True,
                "mensagem": "Livro não encontrado."
            }), 404

        descricao = ""

        if livro[6]:

            descricao = livro[6]

            if hasattr(descricao, "read"):
                descricao = descricao.read()

        return jsonify({

            "livro": {

                "id_livro": livro[0],
                "titulo": livro[1],
                "autor": livro[2],
                "genero": livro[3],
                "ano_publicacao": livro[4],
                "estoque": livro[5],
                "descricao": descricao

            }

        })

    except Exception as e:

        return jsonify({
            "erro": True,
            "mensagem": str(e)
        }), 500

    finally:

        cur.close()

@app.route(
    '/pagar_multa/<int:id_emprestimo>',
    methods=['GET', 'PUT']
)
def pagar_multa(id_emprestimo):

    cur = con.cursor()

    try:

        # =========================
        # GERAR QR CODE PIX
        # =========================

        if request.method == 'GET':

            cur.execute("""

                SELECT
                    MULTA,
                    MULTA_PAGA

                FROM EMPRESTIMOS

                WHERE ID_EMPRESTIMO = ?

            """, (id_emprestimo,))

            emprestimo = cur.fetchone()

            if not emprestimo:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Empréstimo não encontrado."
                }), 404

            multa = emprestimo[0]

            multa_paga = emprestimo[1]

            if multa_paga == 1:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Multa já foi paga."
                }), 400

            if not multa or multa <= 0:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Nenhuma multa pendente."
                }), 400

            payload_pix = gerar_payload_pix(

                chave="50625936892",

                nome="BOOKPLUS",

                cidade="BIRIGUI",

                valor=float(multa),

                txid=f"BOOK{id_emprestimo}"

            )

            qr = qrcode.make(payload_pix)

            buffer = BytesIO()

            qr.save(buffer, format="PNG")

            qr_base64 = base64.b64encode(
                buffer.getvalue()
            ).decode()

            return jsonify({
                "erro": False,
                "valor_multa": multa,
                "pix_copia_cola": payload_pix,
                "qr_code":
                    f"data:image/png;base64,{qr_base64}"
            })


        elif request.method == 'PUT':

            cur.execute("""

                SELECT
                    MULTA,
                    MULTA_PAGA

                FROM EMPRESTIMOS

                WHERE ID_EMPRESTIMO = ?

            """, (id_emprestimo,))

            emprestimo = cur.fetchone()

            if not emprestimo:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Empréstimo não encontrado."
                }), 404

            multa = emprestimo[0]

            multa_paga = emprestimo[1]

            if multa_paga == 1:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Multa já paga."
                }), 400

            if not multa or multa <= 0:

                return jsonify({
                    "erro": True,
                    "mensagem":
                        "Nenhuma multa pendente."
                }), 400

            cur.execute("""

                UPDATE EMPRESTIMOS

                SET
                    MULTA_PAGA = 1

                WHERE ID_EMPRESTIMO = ?

            """, (id_emprestimo,))

            con.commit()

            return jsonify({

                "erro": False,

                "mensagem":
                    "Pagamento confirmado com sucesso."

            })

    except Exception as e:

        print("ERRO PIX:", e)

        con.rollback()

        return jsonify({

            "erro": True,

            "mensagem": str(e)

        }), 500

    finally:

        cur.close()


# ─────────────────────────────────────────
# RELATÓRIO 1 — Livros mais emprestados
# ─────────────────────────────────────────
@app.route('/relatorio/livros_mais_emprestados', methods=['GET'])
def relatorio_livros_mais_emprestados():
    cur = con.cursor()
    try:
        cur.execute("""
            SELECT
                l.TITULO,
                l.AUTOR,
                COUNT(e.ID_EMPRESTIMO) AS TOTAL
            FROM EMPRESTIMOS e
            INNER JOIN LIVRO l ON l.ID_LIVRO = e.ID_LIVRO
            GROUP BY l.TITULO, l.AUTOR
            ORDER BY TOTAL DESC
        """)
        livros = cur.fetchall()

        if not livros:
            return jsonify({"error": "Nenhum dado encontrado"}), 404

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Cabeçalho
        pdf.set_fill_color(26, 60, 94)
        pdf.rect(0, 0, 210, 28, 'F')
        pdf.set_font("Arial", style='B', size=18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 28, "BookPlus - Livros Mais Emprestados", ln=True, align='C')

        # Data
        from datetime import datetime
        pdf.set_font("Arial", size=9)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 8, f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", ln=True, align='R')
        pdf.ln(4)

        # Cabeçalho da tabela
        pdf.set_fill_color(240, 246, 255)
        pdf.set_text_color(26, 60, 94)
        pdf.set_font("Arial", style='B', size=10)
        pdf.cell(10, 10, "#", border=1, align='C', fill=True)
        pdf.cell(100, 10, "Título", border=1, align='C', fill=True)
        pdf.cell(55, 10, "Autor", border=1, align='C', fill=True)
        pdf.cell(25, 10, "Empréstimos", border=1, align='C', fill=True)
        pdf.ln()

        # Linhas
        pdf.set_font("Arial", size=10)
        for i, livro in enumerate(livros):
            fill = i % 2 == 0
            pdf.set_fill_color(249, 249, 249) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(10, 9, str(i + 1), border=1, align='C', fill=True)
            pdf.cell(100, 9, str(livro[0])[:48], border=1, fill=True)
            pdf.cell(55, 9, str(livro[1])[:28], border=1, fill=True)
            pdf.set_font("Arial", style='B', size=10)
            pdf.set_text_color(26, 60, 94)
            pdf.cell(25, 9, str(livro[2]), border=1, align='C', fill=True)
            pdf.set_font("Arial", size=10)
            pdf.set_text_color(50, 50, 50)
            pdf.ln()

        # Total
        pdf.ln(6)
        pdf.set_font("Arial", style='B', size=11)
        pdf.set_text_color(26, 60, 94)
        pdf.cell(0, 10, f"Total de títulos no relatório: {len(livros)}", ln=True, align='C')

        pdf_path = "relatorio_livros_mais_emprestados.pdf"
        pdf.output(pdf_path)
        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# ─────────────────────────────────────────
# RELATÓRIO 2 — Empréstimos por mês
# ─────────────────────────────────────────
@app.route('/relatorio/emprestimos_por_mes', methods=['GET'])
def relatorio_emprestimos_por_mes():
    cur = con.cursor()
    try:
        cur.execute("""
            SELECT
                EXTRACT(YEAR FROM DATA_EMPRESTIMO)  AS ANO,
                EXTRACT(MONTH FROM DATA_EMPRESTIMO) AS MES,
                COUNT(*) AS TOTAL
            FROM EMPRESTIMOS
            GROUP BY ANO, MES
            ORDER BY ANO DESC, MES DESC
        """)
        dados = cur.fetchall()

        if not dados:
            return jsonify({"error": "Nenhum dado encontrado"}), 404

        MESES = {
            1:'Janeiro', 2:'Fevereiro', 3:'Março', 4:'Abril',
            5:'Maio', 6:'Junho', 7:'Julho', 8:'Agosto',
            9:'Setembro', 10:'Outubro', 11:'Novembro', 12:'Dezembro'
        }

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Cabeçalho
        pdf.set_fill_color(26, 60, 94)
        pdf.rect(0, 0, 210, 28, 'F')
        pdf.set_font("Arial", style='B', size=18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 28, "BookPlus - Empréstimos por Mês", ln=True, align='C')

        from datetime import datetime
        pdf.set_font("Arial", size=9)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 8, f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", ln=True, align='R')
        pdf.ln(4)

        # Cabeçalho tabela
        pdf.set_fill_color(240, 246, 255)
        pdf.set_text_color(26, 60, 94)
        pdf.set_font("Arial", style='B', size=10)
        pdf.cell(70, 10, "Mês", border=1, align='C', fill=True)
        pdf.cell(40, 10, "Ano", border=1, align='C', fill=True)
        pdf.cell(80, 10, "Total de Empréstimos", border=1, align='C', fill=True)
        pdf.ln()

        # Barra máxima para o gráfico
        max_total = max(row[2] for row in dados)

        pdf.set_font("Arial", size=10)
        for i, row in enumerate(dados):
            ano, mes, total = int(row[0]), int(row[1]), int(row[2])
            fill = i % 2 == 0
            pdf.set_fill_color(249, 249, 249) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(70, 9, MESES.get(mes, str(mes)), border=1, fill=True)
            pdf.cell(40, 9, str(ano), border=1, align='C', fill=True)
            pdf.set_font("Arial", style='B', size=10)
            pdf.set_text_color(26, 60, 94)
            pdf.cell(80, 9, str(total), border=1, align='C', fill=True)
            pdf.set_font("Arial", size=10)
            pdf.set_text_color(50, 50, 50)
            pdf.ln()

        # Gráfico de barras simples
        pdf.ln(10)
        pdf.set_font("Arial", style='B', size=12)
        pdf.set_text_color(26, 60, 94)
        pdf.cell(0, 10, "Gráfico de Empréstimos por Mês", ln=True, align='C')
        pdf.ln(4)

        bar_max_width = 130
        bar_height = 7
        x_label = 15
        x_bar = 55

        for row in reversed(dados[-12:]):  # últimos 12 meses
            ano, mes, total = int(row[0]), int(row[1]), int(row[2])
            label = f"{MESES.get(mes,'')[:3]}/{str(ano)[2:]}"
            bar_width = int((total / max_total) * bar_max_width) if max_total > 0 else 0

            pdf.set_font("Arial", size=8)
            pdf.set_text_color(80, 80, 80)
            pdf.set_xy(x_label, pdf.get_y())
            pdf.cell(38, bar_height, label, align='R')

            y = pdf.get_y()
            pdf.set_fill_color(26, 60, 94)
            pdf.rect(x_bar, y, bar_width if bar_width > 0 else 1, bar_height - 1, 'F')

            pdf.set_xy(x_bar + bar_width + 2, y)
            pdf.set_font("Arial", style='B', size=8)
            pdf.set_text_color(26, 60, 94)
            pdf.cell(20, bar_height, str(total))
            pdf.ln(bar_height + 1)

        pdf_path = "relatorio_emprestimos_por_mes.pdf"
        pdf.output(pdf_path)
        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# ─────────────────────────────────────────
# RELATÓRIO 3 — Usuários que reservam e não buscam
# ─────────────────────────────────────────
@app.route('/relatorio/usuarios_nao_buscam', methods=['GET'])
def relatorio_usuarios_nao_buscam():
    cur = con.cursor()
    try:
        cur.execute("""
            SELECT
                u.NOME,
                u.EMAIL,
                COUNT(e.ID_EMPRESTIMO) AS TOTAL_CANCELADOS
            FROM EMPRESTIMOS e
            INNER JOIN USUARIOS u ON u.ID_USUARIO = e.ID_USUARIO
            WHERE e.STATUS = 'CANCELADO'
            GROUP BY u.NOME, u.EMAIL
            ORDER BY TOTAL_CANCELADOS DESC
        """)
        usuarios = cur.fetchall()

        if not usuarios:
            return jsonify({"error": "Nenhum dado encontrado"}), 404

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Cabeçalho
        pdf.set_fill_color(26, 60, 94)
        pdf.rect(0, 0, 210, 28, 'F')
        pdf.set_font("Arial", style='B', size=16)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 28, "BookPlus - Usuarios com Reservas Canceladas", ln=True, align='C')

        from datetime import datetime
        pdf.set_font("Arial", size=9)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 8, f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", ln=True, align='R')
        pdf.ln(2)

        pdf.set_font("Arial", size=10)
        pdf.set_text_color(150, 60, 0)
        pdf.cell(0, 8, "Usuários que realizaram reservas e não foram buscar o livro.", ln=True, align='C')
        pdf.ln(4)

        # Cabeçalho tabela
        pdf.set_fill_color(240, 246, 255)
        pdf.set_text_color(26, 60, 94)
        pdf.set_font("Arial", style='B', size=10)
        pdf.cell(10, 10, "#", border=1, align='C', fill=True)
        pdf.cell(75, 10, "Nome", border=1, align='C', fill=True)
        pdf.cell(80, 10, "Email", border=1, align='C', fill=True)
        pdf.cell(25, 10, "Cancelados", border=1, align='C', fill=True)
        pdf.ln()

        pdf.set_font("Arial", size=10)
        for i, usuario in enumerate(usuarios):
            fill = i % 2 == 0
            pdf.set_fill_color(249, 249, 249) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(10, 9, str(i + 1), border=1, align='C', fill=True)
            pdf.cell(75, 9, str(usuario[0])[:35], border=1, fill=True)
            pdf.cell(80, 9, str(usuario[1])[:38], border=1, fill=True)
            pdf.set_font("Arial", style='B', size=10)
            pdf.set_text_color(192, 57, 43)
            pdf.cell(25, 9, str(usuario[2]), border=1, align='C', fill=True)
            pdf.set_font("Arial", size=10)
            pdf.set_text_color(50, 50, 50)
            pdf.ln()

        pdf.ln(6)
        pdf.set_font("Arial", style='B', size=11)
        pdf.set_text_color(26, 60, 94)
        pdf.cell(0, 10, f"Total de usuários no relatório: {len(usuarios)}", ln=True, align='C')

        pdf_path = "relatorio_usuarios_nao_buscam.pdf"
        pdf.output(pdf_path)
        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()