import fdb
from flask import Flask
app = Flask(__name__)
app.config.from_pyfile('config.py')

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

from view import *

if __name__ == '__main__':
    app.run(debug=True)