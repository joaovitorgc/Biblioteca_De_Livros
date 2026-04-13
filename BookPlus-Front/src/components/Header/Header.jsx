import React from 'react';
import estilo from './Header.module.css';

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
                    <a href="/public" className={estilo.navLink}>HOME</a>
                    <a href="/cadastro" className={estilo.navLink}>CADASTRE-SE</a>
                    <button className={estilo.loginButton}>ENTRAR</button>
                </nav>
            </header>
        </div>
    );
}