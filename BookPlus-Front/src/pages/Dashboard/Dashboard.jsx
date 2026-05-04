import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Dashboard.module.css";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function Dashboard() {
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const navigate = useNavigate();

    // Verifica se está logado antes de renderizar a tela
    useEffect(() => {
        const usuarioLogado = localStorage.getItem("usuario");

        // Se estiver vazia (null), o usuário não está logado
        if (!usuarioLogado) {
            // Manda de volta pro login com uma mensagem de erro
            navigate("/login", {
                state: {
                    mensagemLogout: "Acesso negado. Faça login para continuar!",
                    tipo: "erro"
                }
            });
        }
    }, [navigate]);

    return (
        <>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <div className={css.container}>
                <div className={css.blur1}></div>
                <div className={css.blur2}></div>

                <div className={css.content}>
                    <h1 className={css.titulo}>
                        Olá, <span>Usuário</span>
                    </h1>

                    <p className={css.subtitulo}>
                        Você está logado com sucesso
                    </p>

                    <div className={css.illustration}>
                        <img src="/nuvem.png" alt="Sucesso" />
                    </div>
                </div>
            </div>
        </>
    );
}