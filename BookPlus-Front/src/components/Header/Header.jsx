import React, { useEffect, useState } from 'react';
import estilo from './Header.module.css';
import { Link, useNavigate } from "react-router-dom";

export default function Header() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [menuAberto, setMenuAberto] = useState(false);

    const toggleMenu = () => setMenuAberto(!menuAberto);

    const fecharMenu = () => setMenuAberto(false);

    useEffect(() => {

        const carregarUsuario = () => {

            const user = JSON.parse(
                localStorage.getItem("usuario")
            );

            setUsuario(user);
        };

        carregarUsuario();

        window.addEventListener(
            "userChanged",
            carregarUsuario
        );

        window.addEventListener(
            "storage",
            carregarUsuario
        );

        return () => {

            window.removeEventListener(
                "userChanged",
                carregarUsuario
            );

            window.removeEventListener(
                "storage",
                carregarUsuario
            );
        };

    }, []);

    async function logout() {

        try {

            await fetch(
                "http://localhost:5000/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

        } catch (error) {

            console.error(
                "Erro ao fazer logout:",
                error
            );
        }

        localStorage.removeItem("usuario");

        window.dispatchEvent(
            new Event("userChanged")
        );

        setUsuario(null);

        fecharMenu();

        navigate(
            "/login",
            {
                state: {
                    mensagemLogout:
                        "Logout realizado com sucesso!",
                    tipo: "sucesso"
                }
            }
        );
    }

    return (
        <div className={estilo.headerContainer}>

            <header className={estilo.header}>

                <div className={estilo.logoContainer}>

                    <span className={estilo.logoTextDark}>
                        BOOK
                    </span>

                    <span className={estilo.logoTextBlue}>
                        PLUS
                    </span>

                    <Link
                        to={"/"}
                        onClick={fecharMenu}
                    >
                        <img
                            src="/iconeLogo.png"
                            alt="Logo"
                            className={estilo.bookIcon}
                        />
                    </Link>

                </div>

                <button
                    className={`
                        ${estilo.hamburger}
                        ${menuAberto ? estilo.ativo : ''}
                    `}
                    onClick={toggleMenu}
                    aria-label="Menu"
                >

                    <span className={estilo.linha}></span>
                    <span className={estilo.linha}></span>
                    <span className={estilo.linha}></span>

                </button>

                <nav
                    className={`
                        ${estilo.nav}
                        ${menuAberto ? estilo.navAberta : ''}
                    `}
                >

                    <Link
                        className={estilo.navLink}
                        to="/"
                        onClick={fecharMenu}
                    >
                        ACERVO
                    </Link>

                    {!usuario ? (

                        <>
                            <Link
                                className={estilo.navLink}
                                to="/cadastro"
                                onClick={fecharMenu}
                            >
                                CADASTRE-SE
                            </Link>

                            <Link
                                className={estilo.loginButton}
                                to="/login"
                                onClick={fecharMenu}
                            >
                                LOGIN
                            </Link>
                        </>

                    ) : (

                        <div className={estilo.userArea}>

                            {usuario.tipo !== 0 && (

                                <Link
                                    className={estilo.navLink}
                                    to="/reservasUsuario"
                                    onClick={fecharMenu}
                                >
                                    RESERVAS
                                </Link>

                            )}

                            <Link
                                to={
                                    usuario.tipo === 0
                                        ? '/AdminUsuarios'
                                        : "/Dashboard"
                                }
                                onClick={fecharMenu}
                            >

                                <img
                                    src={
                                        `http://localhost:5000/uploads/Usuarios/${usuario.id_usuario}.jpg`
                                    }
                                    alt="perfil"
                                    className={estilo.avatar}
                                    onError={(e) => {

                                        e.target.onerror = null;

                                        e.target.src =
                                            "/icone_foto.png";
                                    }}
                                />

                            </Link>

                            <span className={estilo.nome}>
                                {usuario.nome}
                            </span>

                            <button className={estilo.logout} onClick={logout}>
                                <img
                                    src="/sair.png"
                                    alt="Sair"
                                    className={estilo.icon}
                                />
                                Sair
                            </button>
                        </div>
                    )}
                </nav>
            </header>
        </div>
    );
}