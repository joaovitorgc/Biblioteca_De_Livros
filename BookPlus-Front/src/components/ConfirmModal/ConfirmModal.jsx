import estilos from "./ConfirmModal.module.css";

export default function ConfirmModal({
                                         aberto,
                                         titulo,
                                         mensagem,
                                         textoConfirmar = "Confirmar",
                                         tipo = "danger",
                                         onConfirm,
                                         onCancel
                                     }) {

    if (!aberto) return null;

    return (
        <div className={estilos.overlay}>

            <div className={estilos.modal}>

                <h2>{titulo}</h2>

                <p>{mensagem}</p>

                <div className={estilos.botoes}>

                    <button
                        className={estilos.cancelar}
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>

                    <button
                        className={`
                                    ${estilos.confirmar}
                                    ${tipo === "primary" ? estilos.primary : estilos.danger}
                                `}
                        onClick={onConfirm}
                    >
                        {textoConfirmar}
                    </button>

                </div>

            </div>

        </div>
    );
}