from flask import current_app
from flask_bcrypt import generate_password_hash
import random
import smtplib
from email.mime.text import MIMEText
import jwt
from hmac import new
import qrcode
import base64
from io import BytesIO
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import atexit



def validar_senha(senha: str):
    if not senha:
        return False

    maiuscula = minuscula = numero = especial = False

    for s in senha:
        if s.isupper():
            maiuscula = True
        elif s.islower():
            minuscula = True
        elif s.isdigit():
            numero = True
        elif not s.isalnum():
            especial = True

    if len(senha) < 8 or len(senha) > 30:
        return False

    if not (maiuscula and minuscula and numero and especial):
        return False
    return True


def enviando_email(destinatario, assunto, mensagem):
    try:
        user = "joao.gaspar2808@gmail.com"
        senha = "sjit kifr jeqn cndw"

        msg = MIMEText(mensagem)
        msg['Subject'] = assunto
        msg['From'] = user
        msg['To'] = destinatario

        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
        server.starttls()
        server.login(user, senha)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Houve um erro ao enviar email: " + str(e))

def remove_bearer(token):
    if token.startswith('Bearer '):
        return token[len('Bearer '):]
    else:
        return token



# def enviando_email(destinatario, assunto, mensagem):
#         user = "joao.gaspar2808@gmail.com"
#         senha = "sjit kifr jeqn cndw"
#
#         msg = MIMEText(mensagem)
#         msg['Subject'] = assunto
#         msg['From'] = user
#         msg['To'] = destinatario
#
#         server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
#
#         server.login(user, senha)
#         server.send_message(msg)
#         server.quit()
#
#

#


def decodificar_token(token):
    payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    return payload

def gerar_token(payload):
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    return token

def encode_password(password):
    return generate_password_hash(str(password)).decode('utf-8')

def format_field(id, value):

    size = f"{len(value):02d}"

    return f"{id}{size}{value}"


def crc16(payload):

    polinomio = 0x1021

    resultado = 0xFFFF

    for c in payload:

        resultado ^= (ord(c) << 8)

        for _ in range(8):

            if (resultado & 0x8000):

                resultado = (
                    (resultado << 1) ^ polinomio
                )

            else:

                resultado <<= 1

            resultado &= 0xFFFF

    return f"{resultado:04X}"


def gerar_payload_pix(
    chave,
    nome,
    cidade,
    valor,
    txid="***"
):

    payload = ""

    payload += format_field("00", "01")

    merchant_account = ""

    merchant_account += format_field(
        "00",
        "br.gov.bcb.pix"
    )

    merchant_account += format_field(
        "01",
        chave
    )

    payload += format_field(
        "26",
        merchant_account
    )

    payload += format_field(
        "52",
        "0000"
    )

    payload += format_field(
        "53",
        "986"
    )

    if valor:

        payload += format_field(
            "54",
            f"{valor:.2f}"
        )

    payload += format_field(
        "58",
        "BR"
    )

    payload += format_field(
        "59",
        nome[:25]
    )

    payload += format_field(
        "60",
        cidade[:15]
    )

    additional = format_field(
        "05",
        txid
    )

    payload += format_field(
        "62",
        additional
    )

    payload += "6304"

    crc = crc16(payload)

    payload += crc

    return payload

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def email_reserva_confirmada(destinatario, nome_usuario, titulo_livro, data_limite):
    try:
        user = "joao.gaspar2808@gmail.com"
        senha = "sjit kifr jeqn cndw"

        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#1a3c5e;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:1px;">📚 BookPlus</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#1a3c5e;margin:0 0 16px;">Reserva confirmada!</h2>
                    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      Olá, <strong>{nome_usuario}</strong>! Sua reserva foi realizada com sucesso.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f0f6ff;border-radius:8px;padding:20px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#888;font-size:13px;">Livro reservado</span><br>
                          <strong style="color:#1a3c5e;font-size:16px;">{titulo_livro}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #d0dff0;">
                          <span style="color:#888;font-size:13px;">Retire até</span><br>
                          <strong style="color:#e05c00;font-size:16px;">{data_limite}</strong>
                        </td>
                      </tr>
                    </table>
                    <div style="background:#fff8e1;border-left:4px solid #f5a623;border-radius:4px;padding:16px;margin-bottom:32px;">
                      <p style="margin:0;color:#7a5700;font-size:14px;line-height:1.6;">
                        ⏰ <strong>Atenção:</strong> você tem <strong>24 horas</strong> para retirar o livro na biblioteca.
                        Caso não retire até a data indicada, sua reserva será cancelada automaticamente.
                      </p>
                    </div>
                    <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                      BookPlus — Sistema de Biblioteca
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg['Subject'] = "✅ Reserva confirmada — BookPlus"
        msg['From'] = user
        msg['To'] = destinatario
        msg.attach(MIMEText(html, "html"))

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
        server.login(user, senha)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Erro ao enviar email de reserva:", e)


def email_reserva_cancelada(destinatario, nome_usuario, titulo_livro):
    try:
        user = "joao.gaspar2808@gmail.com"
        senha = "sjit kifr jeqn cndw"

        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#1a3c5e;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:1px;">📚 BookPlus</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#c0392b;margin:0 0 16px;">Reserva cancelada</h2>
                    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      Olá, <strong>{nome_usuario}</strong>. Infelizmente sua reserva foi cancelada automaticamente.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fff0f0;border-radius:8px;padding:20px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#888;font-size:13px;">Livro</span><br>
                          <strong style="color:#1a3c5e;font-size:16px;">{titulo_livro}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #f0c0c0;">
                          <span style="color:#888;font-size:13px;">Motivo</span><br>
                          <strong style="color:#c0392b;font-size:15px;">Prazo de 24h para retirada não cumprido</strong>
                        </td>
                      </tr>
                    </table>

                    <div style="background:#f0f6ff;border-left:4px solid #1a3c5e;border-radius:4px;padding:16px;margin-bottom:32px;">
                      <p style="margin:0;color:#1a3c5e;font-size:14px;line-height:1.6;">
                        💡 Você pode fazer uma nova reserva a qualquer momento pelo sistema.
                        O estoque do livro já foi restaurado.
                      </p>
                    </div>

                    <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                      BookPlus — Sistema de Biblioteca
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg['Subject'] = "❌ Reserva cancelada — BookPlus"
        msg['From'] = user
        msg['To'] = destinatario
        msg.attach(MIMEText(html, "html"))

        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
        server.starttls()
        server.login(user, senha)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Erro ao enviar email de cancelamento:", e)


def cancelar_reservas_expiradas():
    from funcao import email_reserva_cancelada
    try:
        cur = con.cursor()
        cur.execute("""
            SELECT e.ID_EMPRESTIMO, e.ID_LIVRO, u.EMAIL, u.NOME, l.TITULO
            FROM EMPRESTIMOS e
            INNER JOIN USUARIOS u ON u.ID_USUARIO = e.ID_USUARIO
            INNER JOIN LIVRO l ON l.ID_LIVRO = e.ID_LIVRO
            WHERE e.STATUS = 'RESERVADO'
              AND e.DATA_LIMITE_RESERVA < CURRENT_DATE
        """)
        expiradas = cur.fetchall()

        for reserva in expiradas:
            id_emprestimo, id_livro, email, nome, titulo = reserva

            cur.execute("""
                UPDATE EMPRESTIMOS
                SET STATUS = 'CANCELADO'
                WHERE ID_EMPRESTIMO = ?
            """, (id_emprestimo,))

            cur.execute("""
                UPDATE LIVRO
                SET ESTOQUE = ESTOQUE + 1
                WHERE ID_LIVRO = ?
            """, (id_livro,))

            con.commit()

            threading.Thread(
                target=email_reserva_cancelada,
                args=(email, nome, titulo),
                daemon=True
            ).start()

        if expiradas:
            print(f"[Scheduler] {len(expiradas)} reserva(s) cancelada(s).")

    except Exception as e:
        con.rollback()
        print(f"[Scheduler] Erro ao cancelar reservas: {e}")
    finally:
        cur.close()

scheduler = BackgroundScheduler()
scheduler.add_job(cancelar_reservas_expiradas, 'interval', hours=1)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

from email.mime.image import MIMEImage

def email_multa_atraso(destinatario, nome_usuario, titulo_livro, dias_atraso, valor_multa, qr_bytes, pix_copia_cola):
    try:
        user = "joao.gaspar2808@gmail.com"
        senha = "sjit kifr jeqn cndw"

        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#1a3c5e;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:1px;">📚 BookPlus</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#c0392b;margin:0 0 16px;">Devolução com atraso</h2>
                    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      Olá, <strong>{nome_usuario}</strong>. O livro abaixo foi devolvido com atraso e uma multa foi gerada.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fff0f0;border-radius:8px;padding:20px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#888;font-size:13px;">Livro devolvido</span><br>
                          <strong style="color:#1a3c5e;font-size:16px;">{titulo_livro}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #f0c0c0;">
                          <span style="color:#888;font-size:13px;">Dias de atraso</span><br>
                          <strong style="color:#c0392b;font-size:16px;">{dias_atraso} dia(s)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #f0c0c0;">
                          <span style="color:#888;font-size:13px;">Valor da multa</span><br>
                          <strong style="color:#c0392b;font-size:22px;">R$ {valor_multa:.2f}</strong>
                        </td>
                      </tr>
                    </table>
                    <div style="background:#f0f6ff;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;">
                      <p style="margin:0 0 16px;color:#1a3c5e;font-size:15px;font-weight:bold;">Pague via PIX</p>
                      <img src="cid:qrcode_pix" alt="QR Code PIX" width="200" height="200"
                        style="display:block;margin:0 auto 16px;border-radius:8px;" />
                      <p style="margin:0 0 8px;color:#888;font-size:12px;">Ou copie o código abaixo:</p>
                      <div style="background:#e8f0fe;border-radius:6px;padding:12px;word-break:break-all;">
                        <code style="font-size:11px;color:#1a3c5e;">{pix_copia_cola}</code>
                      </div>
                    </div>
                    <div style="background:#fff8e1;border-left:4px solid #f5a623;border-radius:4px;padding:16px;margin-bottom:32px;">
                      <p style="margin:0;color:#7a5700;font-size:14px;line-height:1.6;">
                        ⚠️ <strong>Atenção:</strong> enquanto a multa não for paga, você não poderá realizar novas reservas.
                      </p>
                    </div>
                    <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                      BookPlus — Sistema de Biblioteca
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """

        msg = MIMEMultipart("related")
        msg['Subject'] = "⚠️ Multa por atraso na devolução — BookPlus"
        msg['From'] = user
        msg['To'] = destinatario

        body = MIMEMultipart("alternative")
        body.attach(MIMEText(html, "html"))
        msg.attach(body)

        img = MIMEImage(qr_bytes)
        img.add_header('Content-ID', '<qrcode_pix>')
        img.add_header('Content-Disposition', 'inline', filename='qrcode.png')
        msg.attach(img)

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
        server.login(user, senha)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Erro ao enviar email de multa:", e)