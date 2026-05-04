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

        carregarUsuario(); // Carregamento inicial

        // Agrupando todos os listeners no mesmo useEffect
        window.addEventListener("userChanged", carregarUsuario);
        window.addEventListener("storage", carregarUsuario);

        return () => {
            window.removeEventListener("userChanged", carregarUsuario);
            window.removeEventListener("storage", carregarUsuario);
        };
    }, []);

    async function logout() {
        try {
            await fetch("http://localhost:5000/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }

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
                    <img src="/iconeLogo.png" alt="Logo" className={estilo.bookIcon} />
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
                                    e.target.onerror = null; // Evita loop infinito caso a imagem de fallback também falhe
                                    e.target.src = "/icone_foto.png";
                                }}
                            />

                            <span className={estilo.nome}>{usuario.nome}</span>

                            <button className={estilo.logout} onClick={logout}>
                                <img src="/sair.png" alt="Sair" className={estilo.icon} />
                                Sair
                            </button>
                        </div>
                    )}
                </nav>
            </header>
        </div>
    );
}