import React from 'react';
import estilo from './Header.module.css';
import { Link } from "react-router-dom";

export default function Header() {
    return (
        <div className={estilo.headerContainer}>
            <header className={estilo.header}>
                <div className={estilo.logoContainer}>
                    <span className={estilo.logoTextDark}>BOOK</span>
                    <span className={estilo.logoTextBlue}>PLUS</span>

                    <img
                        src={"iconeLogo.png"}
                        alt="Ícone de livro"
                        className={estilo.bookIcon}
                    />
                </div>

                <nav className={estilo.nav}>
                    <Link className={estilo.navLink} to={"/"}>HOME</Link>
                    <Link className={estilo.navLink} to={"/cadastro"}>CADASTRE-SE</Link>
                    <Link className={estilo.loginButton} to="/Login">LOGIN</Link>                </nav>
            </header>
        </div>
    );
}