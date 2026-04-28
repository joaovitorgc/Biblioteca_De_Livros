import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import css from "./validarEmail.module.css";

export default function ValidarEmail() {
    const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
    const [mensagem, setMensagem] = useState("");
    const codigoCompleto = codigo.every((n) => n !== "");

    const inputsRef = useRef([]);
    const location = useLocation();
    const email = location.state?.email || "";

    function handleChange(value, index) {
        if (!/^[0-9]?$/.test(value)) return;

        const novoCodigo = [...codigo];
        novoCodigo[index] = value;
        setCodigo(novoCodigo);

        if (value && index < 5) {
            inputsRef.current[index + 1].focus();
        }
    }

    function handleKeyDown(e, index) {
        if (e.key === "Backspace" && !codigo[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    }

    async function verificarCodigo(e) {
        e.preventDefault();

        const codigoFinal = codigo.join("");

        try {
            const resposta = await fetch("http://localhost:5000/verificar_email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    codigo: codigoFinal
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("Email validado com sucesso!");
            } else {
                setMensagem(dados.error);
            }

        } catch {
            setMensagem("Erro ao conectar com a API");
        }
    }

    return (
        <div className={css.container}>
            <form className={css.caixa} onSubmit={verificarCodigo}>
                <h1>Verificação de Email</h1>
                <p className={css.subtitulo}>
                    Digite o código de 6 dígitos enviado para seu email
                </p>

                <div className={css.inputs}>
                    {codigo.map((num, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={num}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputsRef.current[index] = el)}
                            className={css.input}
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    className={`${css.botao} ${codigoCompleto ? css.botaoAtivo : ""}`}>
                    VALIDAR
                </button>

                {mensagem && <p className={css.mensagem}>{mensagem}</p>}
            </form>
        </div>
    );
}