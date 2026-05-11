import React, {useEffect, useState} from 'react';
import estilos from './AdminUsuarios.module.css';

import CartaoEstatistica from '../../components/CartaoEstatistica/CartaoEstatistica';
import AbasNavegacao from '../../components/AbasNavegacao/AbasNavegacao';
import CartaoUsuario from '../../components/CartaoUsuario/CartaoUsuario';

export default function AdminUsuarios() {
    const [abaSelecionada, setAbaSelecionada] = useState('Usuários');
    const [listaDeUsuarios, setListaDeUsuarios] = useState([]);

    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Empréstimos", valor: 9 },
        { id: 2, titulo: "Usuários Cadastrados", valor: 7 },
        { id: 3, titulo: "Livros Cadastrados", valor: 10 }
    ];

    const listaDeAbas = ['Usuários', 'Livros', 'Relatórios', 'Empréstimos'];


    async function buscarUsuarios() {
        var resposta = await fetch("http://127.0.0.1:5000/listar_usuarios", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        })

        resposta = await resposta.json();

        console.log(resposta);

        setListaDeUsuarios(resposta);
    }

    useEffect(() => async function (){
            await buscarUsuarios()
    }, [])

    return (
        <div className={estilos.containerGeral}>
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
                    abaAtiva={abaSelecionada}
                    aoMudarAba={setAbaSelecionada}
                />

                {abaSelecionada === 'Usuários' && (
                    <section className={estilos.secaoUsuarios}>
                        <div className={estilos.cabecalhoLista}>
                            <button className={estilos.botaoNovo}>+ Novo Usuário</button>
                        </div>

                        <div className={estilos.fundoLista}>
                            {listaDeUsuarios.map((usuario) => (
                                <CartaoUsuario
                                    key={usuario.id}
                                    id={usuario.id}
                                    nome={usuario.nome}
                                    email={usuario.email}
                                />
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}