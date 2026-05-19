import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import estilos from './DetalhesLivro.module.css';

import FlashMessage from '../../components/FlashMessage/FlashMessage.jsx';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal.jsx';

export default function DetalhesLivro() {

    const { id } = useParams();

    const [livro, setLivro] = useState(null);

    const [loading, setLoading] = useState(true);

    const [reservado, setReservado] = useState(false);

    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("");

    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {

        buscarLivro();

        verificarReserva();

    }, []);

    async function buscarLivro() {

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/livro/${id}`
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);

                setTipoMensagem("erro");

                return;
            }

            setLivro(dados.livro);

        } catch (erro) {

            console.log(erro);

            setMensagem("Erro ao carregar livro.");

            setTipoMensagem("erro");

        } finally {

            setLoading(false);

        }
    }

    async function verificarReserva() {

        const usuario = JSON.parse(
            localStorage.getItem("usuario")
        );

        if (!usuario) {
            return;
        }

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/verificar-emprestimo/${usuario.id_usuario}/${id}`
            );

            const dados = await resposta.json();

            setReservado(dados.emprestado);

        } catch (erro) {

            console.log(erro);

        }
    }

    async function reservarLivro() {

        const usuario = JSON.parse(
            localStorage.getItem("usuario")
        );

        if (!usuario) {

            setMensagem("Faça login para reservar.");

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

            setReservado(true);

            setLivro((prev) => ({
                ...prev,
                estoque: prev.estoque - 1
            }));

        } catch (erro) {

            console.log(erro);

            setMensagem("Erro ao reservar livro.");

            setTipoMensagem("erro");

        }

        setModalAberto(false);
    }

    if (loading) {

        return (
            <main className={estilos.container}>
                <p>Carregando livro...</p>
            </main>
        );
    }

    if (!livro) {

        return (
            <main className={estilos.container}>
                <p>Livro não encontrado.</p>
            </main>
        );
    }

    return (

        <main className={estilos.container}>

            <FlashMessage
                mensagem={mensagem}
                tipo={tipoMensagem}
                onClose={() => setMensagem("")}
            />

            <ConfirmModal
                aberto={modalAberto}
                titulo="Confirmar reserva"
                mensagem={`Deseja reservar o livro "${livro.titulo}"?`}
                textoConfirmar="Reservar"
                tipo="primary"
                onConfirm={reservarLivro}
                onCancel={() => setModalAberto(false)}
            />

            <div className={estilos.cardLivro}>

                <div className={estilos.imageContainer}>

                    <img
                        src={`http://127.0.0.1:5000/uploads/livros/${livro.id_livro}.jpg`}
                        className={estilos.capa}
                    />

                </div>

                <div className={estilos.info}>

                    <h1 className={estilos.titulo}>
                        {livro.titulo}
                    </h1>

                    <p className={estilos.autor}>
                        {livro.autor}
                    </p>

                    <div className={estilos.badges}>

                        <span className={estilos.genero}>
                            {livro.genero}
                        </span>

                        <span className={estilos.ano}>
                            {livro.ano_publicacao}
                        </span>

                    </div>

                    <p
                        className={`
                            ${estilos.estoque}
                            ${
                            livro.estoque <= 0
                                ? estilos.semEstoque
                                : estilos.comEstoque
                        }
                        `}
                    >
                        {
                            livro.estoque <= 0
                                ? "Indisponível"
                                : livro.estoque === 1
                                    ? "1 disponível"
                                    : `${livro.estoque} disponíveis`
                        }
                    </p>

                    <div className={estilos.descricaoContainer}>

                        <h2 className={estilos.subtitulo}>
                            Descrição
                        </h2>

                        <p className={estilos.descricao}>
                            {livro.descricao}
                        </p>

                    </div>

                    <button
                        className={`
                            ${estilos.botaoReservar}
                            ${reservado ? estilos.reservado : ""}
                            ${livro.estoque <= 0 ? estilos.esgotado : ""}
                        `}
                        disabled={
                            reservado || livro.estoque <= 0
                        }
                        onClick={() => setModalAberto(true)}
                    >
                        {
                            livro.estoque <= 0
                                ? "ESGOTADO"
                                : reservado
                                    ? "RESERVADO"
                                    : "RESERVAR"
                        }
                    </button>

                </div>

            </div>

        </main>
    );
}