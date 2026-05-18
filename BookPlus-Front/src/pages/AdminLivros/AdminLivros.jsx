import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import estilos from './AdminLivros.module.css';

import AbasNavegacao from "../../components/AbasNavegacao/AbasNavegacao.jsx";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica.jsx";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";

export default function AdminLivros() {

    const navigate = useNavigate();

    const [livros, setLivros] = useState([]);
    const [totalLivros, setTotalLivros] = useState(0);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');

    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [totalEmprestimos, setTotalEmprestimos] = useState(0);

    // MODAL
    const [modalAberto, setModalAberto] = useState(false);
    const [livroSelecionado, setLivroSelecionado] = useState(null);

    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Empréstimos", valor: totalEmprestimos },
        { id: 2, titulo: "Usuários Cadastrados", valor: totalUsuarios },
        { id: 3, titulo: "Livros Cadastrados", valor: totalLivros }
    ];

    const handleMudarAba = (aba) => {

        if (aba === 'Livros') return;

        const rotas = {
            'Usuários': '/AdminUsuarios',
            'Relatórios': '/AdminRelatorios',
            'Empréstimos': '/AdminEmprestimos'
        };

        navigate(rotas[aba] || '/');
    };

    async function buscarUsuarios() {

        let resposta = await fetch(
            "http://127.0.0.1:5000/listar_usuarios",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            }
        );

        resposta = await resposta.json();

        console.log(resposta);

        setTotalUsuarios(resposta.total_usuarios);
    }

    useEffect(() => {
        buscarUsuarios();
    }, []);

    async function buscarEmprestimos() {

        try {
            const resposta = await fetch(
                "http://127.0.0.1:5000/listar_emprestimos",
                {
                    method: "GET",
                    credentials: "include"
                });
            const dados = await resposta.json();

            setTotalEmprestimos(dados.emprestimos.length);
        } catch (erro) {
            console.log(erro);

        }
    }

    async function buscarLivros() {

        try {

            setLoading(true);

            const response = await fetch(
                'http://127.0.0.1:5000/listar_livros'
            );

            if (!response.ok) {
                throw new Error('Falha ao buscar dados do servidor');
            }

            const data = await response.json();

            console.log(data.livros);

            setLivros(data.livros);
            setTotalLivros(data.total_livros);

        } catch (error) {

            console.error("Erro na requisição:", error);

            setErro(
                'Erro ao carregar livros. Verifique se o servidor está rodando.'
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        buscarLivros();
        buscarEmprestimos();
    }, []);

    // ABRIR MODAL
    function abrirModalExcluir(id) {
        setLivroSelecionado(id);
        setModalAberto(true);
    }

    // CONFIRMAR EXCLUSÃO
    async function confirmarExclusao() {

        try {

            const res = await fetch(
                "http://localhost:5000/deletar_livro/" + livroSelecionado,
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            const dados = await res.json();

            console.log(dados);

            if (res.ok) {

                setMensagem(dados.message);
                setTipo("sucesso");

                buscarLivros();

            } else {

                setMensagem(dados.error);
                setTipo("erro");
            }

        } catch (error) {

            console.log(error);

            setMensagem("Erro ao excluir livro");
            setTipo("erro");
        }

        setModalAberto(false);
    }

    return (

        <main className={estilos.container}>

            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <h1 className={estilos.tituloPagina}>
                Página Administrador
            </h1>

            <div className={estilos.gradeEstatisticas}>

                {dadosEstatisticas.map((dado) => (

                    <CartaoEstatistica
                        key={dado.id}
                        titulo={dado.titulo}
                        valor={dado.valor}
                    />

                ))}

            </div>

            <AbasNavegacao
                abas={[
                    'Usuários',
                    'Livros',
                    'Relatórios',
                    'Empréstimos'
                ]}
                abaAtiva="Livros"
                aoMudarAba={handleMudarAba}
            />

            <div className={estilos.acoesTop}>

                <Link to={"/cadastrolivro"}>

                    <button className={estilos.btnNovoLivro}>
                        + Novo Livro
                    </button>

                </Link>

            </div>

            {erro && (
                <FlashMessage
                    tipo="erro"
                    mensagem={erro}
                />
            )}

            {loading ? (

                <p>Carregando livros...</p>

            ) : (

                <div className={estilos.listaContainer}>

                    {livros && livros.length > 0 ? (

                        livros.map((livro) => (

                            <div
                                key={livro.id_livro}
                                className={estilos.livroCard}
                            >

                                <img
                                    src={`http://127.0.0.1:5000/uploads/Livros/${livro.id_livro}.jpg`}
                                    alt={`Capa do livro ${livro.titulo}`}
                                    className={estilos.livroImagem}
                                />

                                <div className={estilos.livroInfo}>

                                    <p>
                                        <span>Título:</span> {livro.titulo}
                                    </p>

                                    <p>
                                        <span>Autor:</span> {livro.autor}
                                    </p>

                                    <p>
                                        <span>Gênero:</span> {livro.genero}
                                    </p>

                                    <p>
                                        <span>Ano:</span> {livro.ano_publicacao}
                                    </p>

                                    <p>
                                        <span>Estoque:</span> {livro.estoque}
                                    </p>

                                    <div className={estilos.botoesAcao}>

                                        <button
                                            className={estilos.btnExcluir}
                                            onClick={() =>
                                                abrirModalExcluir(
                                                    livro.id_livro
                                                )
                                            }
                                        >
                                            Excluir
                                        </button>

                                        <button
                                            className={estilos.btnEditar}
                                            onClick={() =>
                                                navigate(
                                                    '/editar-livro',
                                                    {
                                                        state: livro
                                                    }
                                                )
                                            }
                                        > Editar </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Nenhum livro cadastrado.</p>
                    )}
                </div>
            )}

            {/* MODAL */}
            <ConfirmModal
                aberto={modalAberto}
                titulo="Excluir livro"
                mensagem="Tem certeza que deseja excluir este livro?"
                onConfirm={confirmarExclusao}
                onCancel={() => setModalAberto(false)}
            />

        </main>
    );
}