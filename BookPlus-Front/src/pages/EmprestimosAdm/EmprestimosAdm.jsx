import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import estilos from './EmprestimosAdm.module.css';

import AbasNavegacao from "../../components/AbasNavegacao/AbasNavegacao.jsx";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica.jsx";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function AdminEmprestimos() {

    const navigate = useNavigate();

    const [emprestimos, setEmprestimos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [erro, setErro] = useState('');

    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [totalLivros, setTotalLivros] = useState(0);

    const dadosEstatisticas = [
        {
            id: 1,
            titulo: "Total De Empréstimos",
            valor: emprestimos.length
        },
        {
            id: 2,
            titulo: "Usuários Cadastrados",
            valor: totalUsuarios
        },
        {
            id: 3,
            titulo: "Livros Cadastrados",
            valor: totalLivros
        }
    ];

    const handleMudarAba = (aba) => {

        if (aba === 'Empréstimos') return;

        const rotas = {
            'Usuários': '/AdminUsuarios',
            'Livros': '/AdminLivros',
            'Relatórios': '/AdminRelatorios'
        };

        navigate(rotas[aba] || '/');
    };

    async function buscarUsuarios() {

        try {

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

            setTotalUsuarios(resposta.total_usuarios);

        } catch (erro) {

            console.log(erro);

        }
    }

    async function buscarLivros() {

        try {

            let resposta = await fetch(
                "http://127.0.0.1:5000/listar_livros"
            );

            resposta = await resposta.json();

            setTotalLivros(resposta.total_livros);

        } catch (erro) {

            console.log(erro);

        }
    }

    async function buscarEmprestimos() {

        try {

            setLoading(true);

            const response = await fetch(
                'http://127.0.0.1:5000/listar_emprestimos',
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error('Falha ao buscar empréstimos');
            }

            const data = await response.json();

            console.log(data);

            setEmprestimos(data.emprestimos);

        } catch (error) {

            console.log(error);

            setErro(
                'Erro ao carregar empréstimos.'
            );

        } finally {

            setLoading(false);

        }
    }

    async function devolverLivro(id_emprestimo) {

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/devolver_livro/${id_emprestimo}`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);
                setTipo("erro");

                return;
            }

            setMensagem(dados.mensagem);
            setTipo("sucesso");

            buscarEmprestimos();

        } catch (erro) {

            console.log(erro);

            setMensagem("Erro ao devolver livro.");
            setTipo("erro");

        }
    }

    useEffect(() => {

        buscarUsuarios();
        buscarLivros();
        buscarEmprestimos();

    }, []);

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
                abaAtiva="Empréstimos"
                aoMudarAba={handleMudarAba}
            />

            {erro && (
                <FlashMessage
                    tipo="erro"
                    mensagem={erro}
                />
            )}

            {loading ? (

                <p>Carregando empréstimos...</p>

            ) : (

                <div className={estilos.listaContainer}>

                    {emprestimos && emprestimos.length > 0 ? (

                        emprestimos.map((emprestimo) => (

                            <div
                                key={emprestimo.id_emprestimo}
                                className={estilos.emprestimoCard}
                            >

                                <img
                                    src={`http://127.0.0.1:5000/uploads/livros/${emprestimo.id_livro}.jpg`}
                                    alt="Livro"
                                    className={estilos.livroImagem}
                                />

                                <div className={estilos.emprestimoInfo}>

                                    <p>
                                        <span>Estoque:</span> {emprestimo.estoque}
                                    </p>

                                    <p>
                                        <span>Emprestados:</span> {emprestimo.emprestados}
                                    </p>

                                    <p>
                                        <span>Usuário:</span> {emprestimo.usuario}
                                    </p>

                                    <p>
                                        <span>Email:</span> {emprestimo.email}
                                    </p>

                                    <p>
                                        <span>Data De Devolução:</span> {emprestimo.data_devolucao}
                                    </p>

                                    <button
                                        className={estilos.btnDevolver}
                                        onClick={() =>
                                            devolverLivro(
                                                emprestimo.id_emprestimo
                                            )
                                        }
                                    >
                                        Devolver
                                    </button>

                                </div>

                            </div>

                        ))

                    ) : (

                        <p>Nenhum empréstimo encontrado.</p>

                    )}

                </div>

            )}

        </main>
    );
}