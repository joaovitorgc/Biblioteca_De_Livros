import React, { useEffect, useState } from 'react';
import CardLivro from '../Card/CardLivro.jsx';
import estilo from './ListaLivros.module.css';

function SkeletonGrid() {
    return Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={estilo.skeletonCard} />
    ));
}

export default function ListaLivros() {
    const [livrosObtidos, setLivrosObtidos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function obterLivros() {
            try {
                const res = await fetch("http://localhost:5000/listar_livros", {
                    method: "GET"
                });
                const data = await res.json();
                setLivrosObtidos(data?.livros ?? []);
            } catch (err) {
                console.error("Erro ao buscar livros:", err);
            } finally {
                setCarregando(false);
            }
        }
        obterLivros();
    }, []);

    return (
        <section className={estilo.containerLista}>
            <div className={estilo.cabecalhoSessao}>
                <h2 className={estilo.tituloSessao}>Acervo</h2>
                <p className={estilo.subtituloSessao}>Explore nossa coleção de livros</p>
            </div>

            {!carregando && livrosObtidos.length > 0 && (
                <p className={estilo.contadorResultados}>
                    {livrosObtidos.length} {livrosObtidos.length === 1 ? 'livro encontrado' : 'livros encontrados'}
                </p>
            )}

            <div className={estilo.gridLivros}>
                {carregando ? (
                    <SkeletonGrid />
                ) : livrosObtidos.length > 0 ? (
                    livrosObtidos.map((livro) => (
                        <CardLivro
                            key={livro?.id_livro}
                            id={livro?.id_livro}
                            titulo={livro?.titulo}
                            autor={livro?.autor}
                            estoque={livro?.estoque}
                        />
                    ))
                ) : (
                    <div className={estilo.estadoVazio}>
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p>Nenhum livro encontrado no acervo.</p>
                    </div>
                )}
            </div>
        </section>
    );
}