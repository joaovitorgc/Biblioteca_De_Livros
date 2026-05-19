import React, { useEffect, useState } from 'react';

import estilos from './ReservasUsuario.module.css';

import FlashMessage from '../../components/FlashMessage/FlashMessage.jsx';

export default function ReservasUsuario() {

    const [reservas, setReservas] = useState([]);

    const [loading, setLoading] = useState(true);

    const [mensagem, setMensagem] = useState("");

    const [tipoMensagem, setTipoMensagem] = useState("");

    useEffect(() => {

        buscarReservas();

    }, []);

    async function buscarReservas() {

        const usuario = JSON.parse(
            localStorage.getItem("usuario")
        );

        if (!usuario) {
            return;
        }

        try {

            setLoading(true);

            const resposta = await fetch(
                `http://127.0.0.1:5000/meus_emprestimos/${usuario.id_usuario}`
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);

                setTipoMensagem("erro");

                return;
            }

            setReservas(dados.emprestimos);

        } catch (erro) {

            console.log(erro);

            setMensagem(
                "Erro ao carregar reservas."
            );

            setTipoMensagem("erro");

        } finally {

            setLoading(false);
        }
    }

    return (

        <main className={estilos.container}>

            <FlashMessage
                mensagem={mensagem}
                tipo={tipoMensagem}
                onClose={() => setMensagem("")}
            />

            <div className={estilos.topo}>

                <h1 className={estilos.titulo}>
                    Minhas Reservas
                </h1>

                <p className={estilos.subtitulo}>
                    Visualize todos os livros reservados
                </p>

            </div>

            {loading ? (

                <div className={estilos.loading}>
                    Carregando reservas...
                </div>

            ) : reservas.length > 0 ? (

                <div className={estilos.gridReservas}>

                    {reservas.map((livro) => (

                        <div
                            key={livro.id_emprestimo}
                            className={estilos.card}
                        >

                            <div className={estilos.imageContainer}>

                                <img
                                    src={
                                        `http://127.0.0.1:5000/uploads/livros/${livro.id_livro}.jpg`
                                    }
                                    className={estilos.capa}
                                />

                            </div>

                            <div className={estilos.info}>

                                <h2 className={estilos.nomeLivro}>
                                    {livro.titulo}
                                </h2>

                                <p>
                                    <span>Autor:</span> {livro.autor}
                                </p>

                                <p>
                                    <span>Reservado em:</span>{" "}
                                    {livro.data_emprestimo}
                                </p>

                                <p>
                                    <span>Devolução:</span>{" "}
                                    {livro.data_devolucao}
                                </p>

                                <div className={estilos.status}>
                                    RESERVADO
                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            ) : (

                <div className={estilos.semReservas}>

                    <h2>
                        Nenhuma reserva encontrada
                    </h2>

                    <p>
                        Você ainda não reservou livros.
                    </p>

                </div>

            )}

        </main>
    );
}