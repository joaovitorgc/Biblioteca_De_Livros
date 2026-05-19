import React from 'react';

import estilos from './CardEmprestimo.module.css';

export default function CardEmprestimo({
                                           id,
                                           idEmprestimo,
                                           usuario,
                                           email,
                                           estoque,
                                           emprestados,
                                           dataDevolucao,
                                           aoDevolver
                                       }) {

    async function devolverLivro() {

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/devolver_livro/${idEmprestimo}`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );

            const dados = await resposta.json();

            if (dados.erro) {

                alert(dados.mensagem);

                return;
            }

            alert(dados.mensagem);

            if (aoDevolver) {
                aoDevolver();
            }

        } catch (erro) {

            console.log(erro);

            alert("Erro ao devolver livro.");

        }
    }

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

                <button
                    className={estilos.botao}
                    onClick={devolverLivro}
                >
                    Devolver
                </button>

            </div>

        </div>
    );
}