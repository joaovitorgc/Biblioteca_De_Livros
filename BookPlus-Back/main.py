import fdb
from flask import Flask
from flask_cors import CORS
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
app.config.from_pyfile('config.py')

from view import *

try:
    con = fdb.connect(
        host=app.config['DB_HOST'],
        user=app.config['DB_USER'],
        password=app.config['DB_PASSWORD'],
        database=app.config['DB_NAME']
    )
    print('Conectado com sucesso')
except Exception as e:
    print("Erro: " + str(e))

if __name__ == '__main__':
    app.run(debug=True)