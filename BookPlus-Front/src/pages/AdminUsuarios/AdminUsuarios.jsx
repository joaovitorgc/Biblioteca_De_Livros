import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import estilos from './AdminUsuarios.module.css';

import CartaoEstatistica from '../../components/CartaoEstatistica/CartaoEstatistica';
import AbasNavegacao from '../../components/AbasNavegacao/AbasNavegacao';
import CartaoUsuario from '../../components/CartaoUsuario/CartaoUsuario';
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";

export default function AdminUsuarios() {

    const navigate = useNavigate();

    const [listaDeUsuarios, setListaDeUsuarios] = useState([]);
    const [totalUsuarios, setTotalUsuarios] = useState(0);

    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const [totalLivros, setTotalLivros] = useState(0);

    const [loading, setLoading] = useState(false);

    // MODAL
    const [modalAberto, setModalAberto] = useState(false);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Empréstimos", valor: 9 },
        { id: 2, titulo: "Usuários Cadastrados", valor: totalUsuarios },
        { id: 3, titulo: "Livros Cadastrados", valor: totalLivros }
    ];

    const listaDeAbas = [
        'Usuários',
        'Livros',
        'Relatórios',
        'Empréstimos'
    ];

    const handleMudarAba = (aba) => {

        if (aba === 'Usuários') return;

        switch (aba) {

            case 'Livros':
                navigate('/AdminLivros');
                break;

            case 'Relatórios':
                navigate('/AdminRelatorios');
                break;

            case 'Empréstimos':
                navigate('/AdminEmprestimos');
                break;

            default:
                navigate('/');
        }
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

            const dados = await resposta.json();

            setListaDeUsuarios(dados.usuarios || []);
            setTotalUsuarios(dados.total_usuarios || 0);

        } catch (erro) {

            console.error("Erro ao buscar usuários:", erro);
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

            setTotalLivros(data.total_livros || 0);

        } catch (error) {

            console.error("Erro ao buscar livros:", error);

        } finally {

            setLoading(false);
        }
    }

    useEffect(() => {

        buscarLivros();
        buscarUsuarios();

    }, []);

    // ABRIR MODAL
    function abrirModalExcluir(id) {

        setUsuarioSelecionado(id);
        setModalAberto(true);
    }

    // CONFIRMAR EXCLUSÃO
    async function confirmarExclusao() {

        try {

            const resposta = await fetch(
                `http://localhost:5000/deletar_usuario/${usuarioSelecionado}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const dados = await resposta.json();

            if (resposta.ok) {

                setMensagem(dados.message);
                setTipo("sucesso");

                buscarUsuarios();

            } else {

                setMensagem(dados.error);
                setTipo("erro");
            }

        } catch (erro) {

            console.log(erro);

            setMensagem("Erro de conexão com o servidor");
            setTipo("erro");
        }

        setModalAberto(false);
    }

    return (

        <div className={estilos.containerGeral}>

            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <main className={estilos.conteudoPrincipal}>

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
                    abas={listaDeAbas}
                    abaAtiva="Usuários"
                    aoMudarAba={handleMudarAba}
                />

                <section className={estilos.secaoUsuarios}>

                    <div className={estilos.fundoLista}>

                        {loading ? (

                            <p>Carregando...</p>

                        ) : (

                            listaDeUsuarios.map((usuario) => (

                                <CartaoUsuario
                                    key={usuario.id}
                                    id={usuario.id}
                                    nome={usuario.nome}
                                    email={usuario.email}

                                    // AQUI
                                    aoExcluir={() =>
                                        abrirModalExcluir(usuario.id)
                                    }
                                />

                            ))

                        )}

                        {!loading && listaDeUsuarios.length === 0 && (
                            <p>Nenhum usuário encontrado.</p>
                        )}

                    </div>

                </section>

            </main>

            {/* MODAL */}
            <ConfirmModal
                aberto={modalAberto}
                titulo="Excluir usuário"
                mensagem="Tem certeza que deseja excluir este usuário?"
                onConfirm={confirmarExclusao}
                onCancel={() => setModalAberto(false)}
            />

        </div>
    );
}