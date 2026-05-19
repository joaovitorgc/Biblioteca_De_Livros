import React, { useEffect, useState } from 'react';

import estilo from './CardLivro.module.css';

import FlashMessage from '../FlashMessage/FlashMessage';
import ConfirmModal from '../ConfirmModal/ConfirmModal';

import { Link } from 'react-router-dom';

export default function CardLivro({ id, titulo, autor, estoque }) {

    const [emprestado, setEmprestado] = useState(false);

    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("");

    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {

        verificarEmprestimo();

    }, []);

    async function verificarEmprestimo() {

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (!usuario) {
            return;
        }

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/verificar-emprestimo/${usuario.id_usuario}/${id}`
            );

            const dados = await resposta.json();

            setEmprestado(dados.emprestado);

        } catch (erro) {

            console.log(erro);

        }
    }

    async function realizarEmprestimo() {

        if (estoque <= 0) {
            return;
        }

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (!usuario) {

            setMensagem("Usuário não encontrado.");
            setTipoMensagem("erro");

            return;
        }

        try {

            const resposta = await fetch(
                "http://127.0.0.1:5000/emprestimos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        id_livro: id,
                        id_usuario: usuario.id_usuario
                    })
                }
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);
                setTipoMensagem("erro");

                return;
            }

            setMensagem(dados.mensagem);
            setTipoMensagem("sucesso");

            setEmprestado(true);

        } catch (erro) {

            console.log(erro);

            setMensagem("Erro ao realizar reserva.");
            setTipoMensagem("erro");

        }

        setModalAberto(false);
    }

    return (
        <>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipoMensagem}
                onClose={() => setMensagem("")}
            />

            <ConfirmModal
                aberto={modalAberto}
                titulo="Confirmar reserva"
                mensagem={`Deseja reservar o livro "${titulo}"?`}
                textoConfirmar="Reservar"
                tipo="primary"
                onConfirm={realizarEmprestimo}
                onCancel={() => setModalAberto(false)}
            />

            <Link
                to={`/livro/${id}`}
                className={estilo.linkCard}
            >

                <div className={estilo.card}>

                    <div className={estilo.imageContainer}>
                        <img
                            src={"http://127.0.0.1:5000/uploads/livros/" + id + ".jpg"}
                            className={estilo.capa}
                        />
                    </div>

                    <div className={estilo.infoContainer}>

                        <h3 className={estilo.titulo}>
                            {titulo}
                        </h3>

                        <p className={estilo.autor}>
                            {autor}
                        </p>

                        <p
                            className={`
                                ${estilo.estoque}
                                ${estoque <= 0 ? estilo.semEstoque : estilo.comEstoque}
                            `}
                        >
                            {
                                estoque <= 0
                                    ? "Indisponível"
                                    : estoque === 1
                                        ? "1 disponível"
                                        : `${estoque} disponíveis`
                            }
                        </p>

                        <div className={estilo.footer}>

                            <button
                                className={`
                                    ${estilo.botaoEmprestar}
                                    ${emprestado ? estilo.emprestado : ""}
                                    ${estoque <= 0 ? estilo.esgotado : ""}
                                `}
                                onClick={(e) => {

                                    e.preventDefault();

                                    setModalAberto(true);

                                }}
                                disabled={emprestado || estoque <= 0}
                            >
                                {
                                    estoque <= 0
                                        ? "ESGOTADO"
                                        : emprestado
                                            ? "RESERVADO"
                                            : "RESERVAR"
                                }
                            </button>

                        </div>

                    </div>

                </div>

            </Link>
        </>
    );
}