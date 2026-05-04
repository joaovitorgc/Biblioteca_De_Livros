import React, { useState, useEffect } from 'react';
import estilos from './Login.module.css';
import { Link, useNavigate, useLocation } from "react-router-dom";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function Login() {
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const navigate = useNavigate();
    // --- Variável location criada ---
    const location = useLocation();

    // --- useEffect lendo a mensagem que veio do Header ---
    useEffect(() => {
        if (location.state?.mensagemLogout) {
            setMensagem(location.state.mensagemLogout);
            setTipo(location.state.tipo);

            // Limpa a rota para não exibir a mensagem novamente se o usuário der F5
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    async function fazerLogin(e) {
        e.preventDefault();

        const email = e.target.email.value;
        const senha = e.target.senha.value;

        try {
            const resposta = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    senha
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                localStorage.setItem("usuario", JSON.stringify(dados.usuario));
                window.dispatchEvent(new Event("userChanged"));

                setMensagem("Login realizado com sucesso!");
                setTipo("sucesso");

                setTimeout(() => {
                    navigate("/dashboard");
                }, 1000);

            } else {
                setMensagem(dados.error);
                setTipo("erro");
            }

        } catch {
            setMensagem("Erro ao conectar com a API");
            setTipo("erro");
        }
    }

    return (
        <>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <main className={estilos.containerPrincipal}>
                <section className={estilos.painelEsquerdo}>
                    <div className={estilos.cartaoLogin}>
                        <h2 className={estilos.titulo}>Realize o Login</h2>

                        <form className={estilos.formulario} onSubmit={fazerLogin}>
                            <div className={estilos.grupoEntrada}>
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" name="email" />
                            </div>

                            <div className={estilos.grupoEntrada}>
                                <label htmlFor="senha">Senha</label>
                                <input type="password" id="senha" name="senha" />
                            </div>

                            <div className={estilos.esqueceuSenha}>
                                <span>Esqueci minha Senha? </span>
                                <Link to={"/RecuperarSenha"} className={estilos.link}>Redefinir</Link>
                            </div>

                            <button type="submit" className={estilos.botaoEntrar}>
                                ENTRAR
                            </button>
                        </form>

                        <div className={estilos.secaoCadastro}>
                            <p>Ainda não possui Cadastro?</p>
                            <Link to={"/cadastro"} className={estilos.botaoCadastrar}>
                                CADASTRE-SE
                            </Link>
                        </div>
                    </div>
                </section>

                <section className={estilos.painelDireito}>
                    <img
                        src="/oRetratoDeDorianGray-livro.jpg"
                        alt="Capa do livro O Retrato de Dorian Gray"
                        className={estilos.imagemLivro}
                    />
                </section>
            </main>
        </>
    );
}