import estilo from "./Footer.module.css";
import React from "react";

export default function Footer() {
    return (
        <footer className={estilo.footerContainer}>
            <div className={estilo.logoContainer}>
                <span className={estilo.logoTextDark}>BOOK</span>
                <span className={estilo.logoTextBlue}>PLUS</span>

                <img
                    src={"iconeLogo.png"}
                    alt="Ícone de livro"
                    className={estilo.bookIcon}
                />
            </div>

            <p className={estilo.texto}>
                © 2026 BookPlus. Todos os direitos reservados.
            </p>
        </footer>
    );
}