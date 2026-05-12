import React, {useEffect, useState} from 'react';
import CardLivro from '../Card/CardLivro.jsx';
import estilo from './ListaLivros.module.css';

export default function ListaLivros() {

    const [ livrosObtidos, setLivrosObtidos ] = useState([]);

    useEffect(() => {
        async function obterLivros() {
            const res = await fetch("http://localhost:5000/listar_livros", {
                method: "GET"
            })
            const data = await res.json();
            setLivrosObtidos(data?.livros);
        }
        // chamar obterLivros();
        obterLivros();
    }, [])

    return (
        <section className={estilo.containerLista}>
            <h2 className={estilo.tituloSessao}>Acervo</h2>

            <div className={estilo.gridLivros}>
                {livrosObtidos ? livrosObtidos.map((livro) =>
                    <CardLivro
                        key={livro?.id_livro}
                        id={livro?.id_livro}
                        titulo={livro?.titulo}
                        autor={livro?.autor}
                    />) : "Não encontrado."
                }
            </div>
        </section>
    );
}
