import React, { useEffect, useState } from 'react';
import estilo from './Header.module.css';
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const carregarUsuario = () => {
            const user = JSON.parse(localStorage.getItem("usuario"));
            setUsuario(user);
        };

        carregarUsuario(); // inicial

        window.addEventListener("userChanged", carregarUsuario);

        return () => {
            window.removeEventListener("userChanged", carregarUsuario);
        };
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("usuario"));
        setUsuario(user);
    }, []);

    useEffect(() => {
        const atualizarUsuario = () => {
            const user = JSON.parse(localStorage.getItem("usuario"));
            setUsuario(user);
        };

        window.addEventListener("storage", atualizarUsuario);

        return () => {
            window.removeEventListener("storage", atualizarUsuario);
        };
    }, []);

    async function logout() {
        await fetch("http://localhost:5000/logout", {
            method: "POST",
            credentials: "include"
        });

        localStorage.removeItem("usuario");
        window.dispatchEvent(new Event("userChanged"));
        setUsuario(null);
        navigate("/login");
    }

    return (
        <div className={estilo.headerContainer}>
            <header className={estilo.header}>
                <div className={estilo.logoContainer}>
                    <span className={estilo.logoTextDark}>BOOK</span>
                    <span className={estilo.logoTextBlue}>PLUS</span>
                    <img src={"iconeLogo.png"} className={estilo.bookIcon} />
                </div>

                <nav className={estilo.nav}>
                    <Link className={estilo.navLink} to="/">HOME</Link>

                    {!usuario ? (
                        <>
                            <Link className={estilo.navLink} to="/cadastro">
                                CADASTRE-SE
                            </Link>
                            <Link className={estilo.loginButton} to="/login">
                                LOGIN
                            </Link>
                        </>
                    ) : (
                        <div className={estilo.userArea}>
                            <img
                                src={`http://localhost:5000/uploads/Usuarios/${usuario.id_usuario}.jpg`}
                                alt="perfil"
                                className={estilo.avatar}
                                onError={(e) => {
                                    e.target.src = "/icone_foto.png";
                                }}
                            />

                            <span className={estilo.nome}>{usuario.nome}</span>

                            <button className={estilo.logout} onClick={logout}>
                                <img src="/" alt="Sair" className={estilo.icon} />
                                Sair
                            </button>
                        </div>
                    )}
                </nav>
            </header>
        </div>
    );
}