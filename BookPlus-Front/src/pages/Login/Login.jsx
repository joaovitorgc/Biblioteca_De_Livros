import React from 'react';
import estilos from './Login.module.css';
import {Link} from "react-router-dom";

export default function Login(){
    return (
        <main className={estilos.containerPrincipal}>
            <section className={estilos.painelEsquerdo}>
                <div className={estilos.cartaoLogin}>
                    <h2 className={estilos.titulo}>Realize o Login</h2>

                    <form className={estilos.formulario}>
                        <div className={estilos.grupoEntrada}>
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" />
                        </div>

                        <div className={estilos.grupoEntrada}>
                            <label htmlFor="senha">Senha</label>
                            <input type="password" id="senha" />
                        </div>

                        <div className={estilos.esqueceuSenha}>
                            <span>Esqueci minha Senha? </span>
                            <a href="#redefinir">Redefinir</a>
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
    );
};

