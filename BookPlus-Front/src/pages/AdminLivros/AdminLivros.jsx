import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Assumindo que você usa react-router-dom
import estilos from './AdminLivros.module.css';
import AbasNavegacao from "../../components/AbasNavegacao/AbasNavegacao.jsx";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica.jsx";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function AdminLivros() {
    const navigate = useNavigate();

    // Como você mencionou que as rotas ainda serão feitas, esta função
    // prepara o terreno para quando elas existirem.
    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Empréstimos", valor: 9 },
        { id: 2, titulo: "Usuários Cadastrados", valor: 8 },
        { id: 3, titulo: "Livros Cadastrados", valor: 10 }
    ];

    const handleMudarAba = (aba) => {
        // Se já estivermos na aba Livros, não faz nada
        if (aba === 'Livros') return;

        // Mapeamento manual das rotas para garantir que o link seja exato
        switch (aba) {
            case 'Usuários':
                navigate('/AdminUsuarios');
                break;
            case 'Relatórios':
                navigate('/AdminRelatorios'); // Ou a rota que você definir
                break;
            case 'Empréstimos':
                navigate('/AdminEmprestimos'); // Ou a rota que você definir
                break;
            default:
                navigate('/');
        }
    };

    // Dados mockados baseados na imagem para você testar o visual
    const livrosMock = [
        {
            id: 1,
            titulo: 'O Retrato de Dorian Gray',
            autor: 'Oscar Wilde',
            ano: '1890',
            estoque: 4,
            emprestados: 2,
            imagem: 'https://via.placeholder.com/120x180?text=Capa+Dorian+Gray' // Substitua pelas imagens reais
        },
        {
            id: 2,
            titulo: 'O Príncipe',
            autor: 'Nicolau Maquiavel',
            ano: '1532',
            estoque: 5,
            emprestados: 0,
            imagem: 'https://via.placeholder.com/120x180?text=Capa+O+Principe' // Substitua pelas imagens reais
        }
    ];

    return (
        <main className={estilos.container}>
            {/* O Header e as Estatísticas ficariam acima daqui, provavelmente em um Layout pai */}
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
                abas={['Usuários', 'Livros', 'Relatórios', 'Empréstimos']}
                abaAtiva="Livros"
                aoMudarAba={handleMudarAba}
            />

            <div className={estilos.acoesTop}>
                <button className={estilos.btnNovoLivro}>
                    + Novo Livro
                </button>
            </div>

            <div className={estilos.listaContainer}>
                {livrosMock.map((livro) => (
                    <div key={livro.id} className={estilos.livroCard}>
                        <img
                            src={livro.imagem}
                            alt={`Capa do livro ${livro.titulo}`}
                            className={estilos.livroImagem}
                        />

                        <div className={estilos.livroInfo}>
                            <p><span>Título:</span> {livro.titulo}</p>
                            <p><span>Autor:</span> {livro.autor}</p>
                            <p><span>Ano de Publicação:</span> {livro.ano}</p>
                            <p><span>Estoque:</span> {livro.estoque}</p>
                            <p><span>Emprestados:</span> {livro.emprestados}</p>

                            <div className={estilos.botoesAcao}>
                                <button className={estilos.btnExcluir}>Excluir</button>
                                <button className={estilos.btnEditar}>Editar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}