import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import estilos from './AdminUsuarios.module.css';

import CartaoEstatistica from '../../components/CartaoEstatistica/CartaoEstatistica';
import AbasNavegacao from '../../components/AbasNavegacao/AbasNavegacao';
import CartaoUsuario from '../../components/CartaoUsuario/CartaoUsuario';
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function AdminUsuarios() {
    const navigate = useNavigate();

    const [listaDeUsuarios, setListaDeUsuarios] = useState([]);
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Empréstimos", valor: 9 },
        { id: 2, titulo: "Usuários Cadastrados", valor: totalUsuarios },
        { id: 3, titulo: "Livros Cadastrados", valor: 10 }
    ];

    const listaDeAbas = ['Usuários', 'Livros', 'Relatórios', 'Empréstimos'];

    const handleMudarAba = (aba) => {
        // Se já estivermos na aba Usuários, não faz nada
        if (aba === 'Usuários') return;

        // Mapeamento manual das rotas
        switch (aba) {
            case 'Livros':
                navigate('/AdminLivros'); // Verifique se sua rota no App.jsx tem esse nome
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
        let resposta = await fetch("http://127.0.0.1:5000/listar_usuarios", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        resposta = await resposta.json();

        console.log(resposta);

        setListaDeUsuarios(resposta.usuarios);
        setTotalUsuarios(resposta.total_usuarios);
    }

    useEffect(() => {
        buscarUsuarios();
    }, []);

    async function excluirUsuario(id) {
        try {
            const resposta = await fetch(
                `http://localhost:5000/deletar_usuario/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
            const dados = await resposta.json();
            console.log(dados);

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
    }

    return (
        <div className={estilos.containerGeral}>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />
            <main className={estilos.conteudoPrincipal}>
                <h1 className={estilos.tituloPagina}>Página Administrador</h1>

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
                    abaAtiva="Usuários" // Fixado como Usuários pois esta é a página deles
                    aoMudarAba={handleMudarAba}
                />

                <section className={estilos.secaoUsuarios}>
                    <div className={estilos.cabecalhoLista}>
                    </div>

                    <div className={estilos.fundoLista}>
                        {listaDeUsuarios.map((usuario) => (
                            <CartaoUsuario
                                key={usuario.id}
                                id={usuario.id}
                                nome={usuario.nome}
                                email={usuario.email}
                                aoExcluir={excluirUsuario}
                            />
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}