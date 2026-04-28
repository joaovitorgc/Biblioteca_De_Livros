import { useEffect } from "react";
import css from "./FlashMessage.module.css";

export default function FlashMessage({ mensagem, tipo, onClose, duracao = 5000 }) {
    useEffect(() => {
        if (!mensagem) return;

        const timer = setTimeout(() => {
            onClose();
        }, duracao);

        return () => clearTimeout(timer);
    }, [mensagem]);

    if (!mensagem) return null;

    return (
        <div className={`${css.flashMessage} ${tipo === "sucesso" ? css.success : css.error}`}>
            {mensagem}
        </div>
    );
}