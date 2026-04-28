import { useState } from "react";
import { useLocation } from "react-router-dom";
import css from "./validarEmail.module.css";

export default function ValidarEmail() {
    const [codigo, setCodigo] = useState("");
    const [mensagem, setMensagem] = useState("");

    const location = useLocation();
    const email = location.state?.email || "";

    async function verificarCodigo(e) {
        e.preventDefault();

        try {
            const resposta = await fetch("http://localhost:5000/verificar_email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    codigo: codigo
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("EMAIL VALIDADO COM SUCESSO!");
            } else {
                setMensagem(dados.error);
            }

        } catch (error) {
            setMensagem("ERRO AO CONECTAR COM A API");
        }
    }

    return (
        <div className={css.container}>
            <form className={css.caixa} onSubmit={verificarCodigo}>
                <h1>Validar Email</h1>

                <input
                    type="text"
                    placeholder="Digite o código"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className={css.input}
                />

                <button type="submit" className={css.botao}>
                    VALIDAR
                </button>

                {mensagem && <p className={css.mensagem}>{mensagem}</p>}
            </form>
        </div>
    );
}