import datetime
import random

from flask import Flask, jsonify, request, make_response
import threading
import os.path

from flask_bcrypt import check_password_hash, generate_password_hash

from main import app, con
from funcao import validar_senha, encode_password, enviando_email, gerar_token, decodificar_token

import jwt

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
                    (nome, email, senha_hash, codigo, 1))
        id_usuario = cur.fetchone()[0]
        con.commit()

        if imagem:
            nome_imagem = f"{id_usuario}.jpg"
            caminho_imagem_destino = os.path.join(app.config['UPLOAD_FOLDER'], "Usuarios")
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
        print(usuario[4])
        if not usuario:
            return jsonify({'error': 'Usuário não encontrado.'}), 404

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
                               UPDATE usuarios SET COALESCE(tentativas,0) = 0 WHERE id_usuario = ?
                               """, (id_usuario,))
                con.commit()

            payload = {
                'id_usuario': id_usuario,
                'nome': nome,
                'email': email,
                'tipo': tipo,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
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
                SET COALESCE(tentativas,0) = (COALESCE(tentativas,0) + 1)
                WHERE id_usuario = ?
            """, (id_usuario,))
            con.commit()
            return jsonify({'error': 'E-mail ou senha incorretos. Tente novamente.'}), 401

        if tentativas == 2 and tipo != 0:
            cursor.execute("""
                UPDATE usuarios
                SET COALESCE(tentativas,0) = 3, situacao = 1
                WHERE id_usuario = ?
            """, (id_usuario,))
            con.commit()
            return jsonify({
                'error': 'Conta bloqueada após 3 tentativas. Contate o administrador.'
            }), 403

        return jsonify({'error': 'E-mail ou senha incorretos. Tente novamente.'}), 401

    except Exception as e:
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
    token = request.cookies.get('access_token')

    if not token:
        return jsonify({"error": "Token de autenticação necessário."}), 401

    try:
        payload = decodificar_token(token)
        id_usuario = payload['id_usuario']
        tipo = payload['tipo']

        if id_usuario != id and tipo != 0: # os ids são diferentes e não é administrador
            return jsonify({"error": "Você não pode editar outro usuário, apenas administradores."}), 401

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalid"}), 401

    cur = con.cursor()
    try:
        cur.execute('SELECT 1 FROM usuarios WHERE id_usuario = ?', (id,))
        if not cur.fetchone():
            return jsonify({"error": "Usuário não encontrado"}), 404

        nome = request.form.get('nome')
        email = request.form.get('email')

        if not nome or not email:
            return jsonify({"error": "Nome e email são obrigatórios."}), 400

        email = request.form.get('email').strip().lower()
        senha = request.form.get('senha')
        imagem = request.files.get('imagem')

        cur.execute('SELECT 1 FROM usuarios WHERE email = ? AND id_usuario != ?', (email, id))
        if cur.fetchone():
            return jsonify({"error": "Email já cadastrado"}), 400

        if not validar_senha(senha):
            return jsonify({"error": "Senha inválida"}), 400

        senha_hash = generate_password_hash(senha).decode('utf-8')

        cur.execute("""
            UPDATE usuarios SET nome = ?, email = ?, senha = ?
            WHERE id_usuario = ? """, (nome, email, senha_hash, id))
        con.commit()

        if imagem:
            nome_imagem = f"{id}.jpg"
            caminho_imagem_destino = os.path.join(app.config['UPLOAD_FOLDER'], "Usuarios")
            os.makedirs(caminho_imagem_destino, exist_ok=True)
            caminho_imagem = os.path.join(caminho_imagem_destino, nome_imagem)
            imagem.save(caminho_imagem)

        return jsonify({
            "message": "Usuário atualizado com sucesso",
            "usuario": {
                "id_usuario": id,
                "nome": nome,
                "email": email
            }
        }), 200

    except Exception as e:
        return jsonify({
            "message": f"Erro ao atualizar usuário.{e}"
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