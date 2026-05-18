import React from 'react';

import estilos from './CardEmprestimo.module.css';

export default function CardEmprestimo({
                                           id,
                                           usuario,
                                           email,
                                           estoque,
                                           emprestados,
                                           dataDevolucao
                                       }) {

    return (
        <div className={estilos.card}>

            <img
                src={"http://127.0.0.1:5000/uploads/livros/" + id + ".jpg"}
                className={estilos.capa}
            />

            <div className={estilos.info}>

                <p>
                    Estoque: {estoque}
                </p>

                <p>
                    Emprestados: {emprestados}
                </p>

                <p>
                    Usuário: {usuario}
                </p>

                <p>
                    Email: {email}
                </p>

                <p>
                    Data De Devolução: {dataDevolucao}
                </p>

                <button className={estilos.botao}>
                    Devolver
                </button>

            </div>

        </div>
    );
}