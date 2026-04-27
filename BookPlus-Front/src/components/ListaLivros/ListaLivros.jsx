import React from 'react';
import CardLivro from '../Card/CardLivro.jsx';
import estilo from './ListaLivros.module.css';

export default function ListaLivros({ livros }) {
    // Verificação de caso a lista venha vazia
    if (!livros || livros.length === 0) {
        return <p>Nenhum livro encontrado.</p>;
    }

    return (
        <section className={estilo.containerLista}>
            <h2 className={estilo.tituloSessao}>Acervo</h2>

            <div className={estilo.gridLivros}>
                {livros.map((livro) => (
                    <CardLivro
                        key={livro.id}
                        imagem={livro.imagem}
                        titulo={livro.titulo}
                        autor={livro.autor}
                    />
                ))}
            </div>
        </section>
    );
}
