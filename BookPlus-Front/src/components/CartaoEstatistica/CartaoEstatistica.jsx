import React from 'react';
import estilos from './CartaoEstatistica.module.css';

export default function CartaoEstatistica({ titulo, valor }) {
    return (
        <div className={estilos.cartao}>
            <h3 className={estilos.titulo}>{titulo}</h3>
            <p className={estilos.valor}>{valor}</p>
        </div>
    );
}