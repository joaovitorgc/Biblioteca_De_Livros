import React from 'react';
import estilo from './CardLivro.module.css';

export default function CardLivro({ id, titulo, autor }) {
    return (
        <div className={estilo.card}>
            <div className={estilo.imageContainer}>
                <img src={"http://127.0.0.1:5000/uploads/livros/" + id + ".jpg"} className={estilo.capa} />
            </div>

            <div className={estilo.infoContainer}>
                <h3 className={estilo.titulo}>{titulo}</h3>
                <p className={estilo.autor}>{autor}</p>
                <div className={estilo.footer}>
                    <button className={estilo.botaoEmprestar}>EMPRÉSTIMO</button>
                </div>
            </div>
        </div>
    );
}