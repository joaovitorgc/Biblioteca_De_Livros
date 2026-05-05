import React from 'react';
import estilos from './AbasNavegacao.module.css';

export default function AbasNavegacao({ abas, abaAtiva, aoMudarAba }) {
    return (
        <div className={estilos.container}>
            {abas.map((aba) => (
                <button
                    key={aba}
                    className={`${estilos.botao} ${abaAtiva === aba ? estilos.ativo : ''}`}
                    onClick={() => aoMudarAba(aba)}
                >
                    {aba}
                </button>
            ))}
        </div>
    );
}