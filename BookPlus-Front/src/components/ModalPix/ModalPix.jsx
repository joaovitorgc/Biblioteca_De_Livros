import React, { useState } from 'react';

import estilos from './ModalPix.module.css';

import FlashMessage from '../FlashMessage/FlashMessage.jsx';

export default function ModalPix({
                                     aberto,
                                     onClose,
                                     idEmprestimo,
                                     aoPagar
                                 }) {

    const [dadosPix, setDadosPix] = useState(null);

    const [loading, setLoading] = useState(false);

    const [mensagem, setMensagem] = useState("");

    const [tipoMensagem, setTipoMensagem] = useState("");

    async function carregarPix() {

        try {

            setLoading(true);

            const resposta = await fetch(
                `http://127.0.0.1:5000/pagar_multa/${idEmprestimo}`
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);

                setTipoMensagem("erro");

                return;
            }

            setDadosPix(dados);

        } catch (erro) {

            console.log(erro);

            setMensagem(
                "Erro ao gerar QR Code."
            );

            setTipoMensagem("erro");

        } finally {

            setLoading(false);

        }
    }

    async function confirmarPagamento() {

        try {

            const resposta = await fetch(
                `http://127.0.0.1:5000/pagar_multa/${idEmprestimo}`,
                {
                    method: "PUT"
                }
            );

            const dados = await resposta.json();

            if (dados.erro) {

                setMensagem(dados.mensagem);

                setTipoMensagem("erro");

                return;
            }

            setMensagem(dados.mensagem);

            setTipoMensagem("sucesso");

            if (aoPagar) {

                aoPagar();

            }

            setTimeout(() => {

                onClose();

            }, 1500);

        } catch (erro) {

            console.log(erro);

            setMensagem(
                "Erro ao confirmar pagamento."
            );

            setTipoMensagem("erro");

        }
    }

    React.useEffect(() => {

        if (aberto && idEmprestimo) {

            carregarPix();

        }

    }, [aberto, idEmprestimo]);

    if (!aberto) return null;

    return (

        <div className={estilos.overlay}>

            <FlashMessage
                mensagem={mensagem}
                tipo={tipoMensagem}
                onClose={() => setMensagem("")}
            />

            <div className={estilos.modal}>

                <button
                    className={estilos.fechar}
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className={estilos.titulo}>
                    Pagamento da Multa
                </h2>

                {
                    loading ? (

                        <p>
                            Gerando QR Code...
                        </p>

                    ) : dadosPix && (

                        <>

                            <p className={estilos.valor}>
                                Valor:
                                <span>
                                    R$ {
                                    Number(
                                        dadosPix.valor_multa
                                    ).toFixed(2)
                                }
                                </span>
                            </p>

                            <img
                                src={dadosPix.qr_code}
                                className={estilos.qrcode}
                            />

                            <textarea
                                readOnly
                                value={
                                    dadosPix.pix_copia_cola
                                }
                                className={estilos.pix}
                            />

                            <button
                                className={
                                    estilos.botaoConfirmar
                                }
                                onClick={
                                    confirmarPagamento
                                }
                            >
                                Confirmar Pagamento
                            </button>

                        </>

                    )
                }

            </div>

        </div>
    );
}