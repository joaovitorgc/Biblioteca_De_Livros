import React from 'react';
import estilos from './CartaoUsuario.module.css';

export default function CartaoUsuario({ id, nome, email }) {
    return (
        <div className={estilos.item}>
            <div className={estilos.infoEsquerda}>
                <div className={estilos.iconeImagem}>
                    <img src={"http://127.0.0.1:5000/uploads/Usuarios/" + id + ".jpg"} alt="" />
                </div>
                <div className={estilos.textos}>
                    <p><strong>Nome:</strong> {nome}</p>
                    <p><strong>Email:</strong> {email}</p>
                </div>
            </div>

            <div className={estilos.botoes}>
                <button className={`${estilos.btnAcao} ${estilos.btnExcluir}`}>Excluir</button>
                <button className={`${estilos.btnAcao} ${estilos.btnEditar}`}>Editar</button>
            </div>
        </div>
    );
}