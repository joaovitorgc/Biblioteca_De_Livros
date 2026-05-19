import React from 'react';

import estilos from './CardEmprestimo.module.css';

export default function CardEmprestimo({
                                           id,
                                           idEmprestimo,
                                           usuario,
                                           email,
                                           estoque,
                                           emprestados,
                                           dataReserva,
                                           dataLimiteReserva,
                                           dataDevolucao,
                                           status,
                                           aoAtualizar
                                       }) {

    async function confirmarRetirada() {

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/confirmar_retirada/${idEmprestimo}`,
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

            if (aoAtualizar) {
                aoAtualizar();
            }

        } catch (erro) {

            console.log(erro);

            alert("Erro ao confirmar retirada.");

        }
    }

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

            if (aoAtualizar) {
                aoAtualizar();
            }

        } catch (erro) {

            console.log(erro);

            alert("Erro ao devolver livro.");

        }
    }

    return (

        <div className={estilos.card}>

            <img
                src={
                    "http://127.0.0.1:5000/uploads/livros/" + id + ".jpg"
                }
                className={estilos.capa}
            />

            <div className={estilos.info}>

                <p>
                    <span>Estoque:</span> {estoque}
                </p>

                <p>
                    <span>Reservados:</span> {emprestados}
                </p>

                <p>
                    <span>Usuário:</span> {usuario}
                </p>

                <p>
                    <span>Email:</span> {email}
                </p>

                <p>
                    <span>Data da Reserva:</span> {dataReserva}
                </p>

                {
                    status === "reservado"
                        ? (
                            <p>
                                <span>Retirar até:</span> {dataLimiteReserva}
                            </p>
                        )
                        : (
                            <p>
                                <span>Devolução:</span> {dataDevolucao}
                            </p>
                        )
                }

                <div className={estilos.statusContainer}>

                    {
                        status === "reservado"
                            ? (
                                <div className={estilos.statusReservado}>
                                    RESERVADO
                                </div>
                            )
                            : (
                                <div className={estilos.statusRetirado}>
                                    RETIRADO
                                </div>
                            )
                    }

                </div>

                {
                    status === "reservado" && (

                        <button
                            className={estilos.btnRetirada}
                            onClick={confirmarRetirada}
                        >
                            Confirmar Retirada
                        </button>

                    )
                }

                {
                    status === "retirado" && (

                        <button
                            className={estilos.botao}
                            onClick={devolverLivro}
                        >
                            Devolver
                        </button>

                  )
                }

            </div>

        </div>

    );
}