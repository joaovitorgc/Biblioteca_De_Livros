import React from 'react';
import estilos from './CartaoUsuario.module.css';

export default function CartaoUsuario({ nome, email }) {
    return (
        <div className={estilos.item}>
            <div className={estilos.infoEsquerda}>
                <div className={estilos.iconeImagem}>
                    {/* Substitua por um ícone de imagem real do seu projeto */}
                    <span>Foto</span>
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