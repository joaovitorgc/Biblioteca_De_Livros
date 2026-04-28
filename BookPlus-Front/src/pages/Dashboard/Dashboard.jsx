import css from "./Dashboard.module.css";

export default function Dashboard() {
    return (
        <div className={css.container}>

            {/* Background decorativo */}
            <div className={css.blur1}></div>
            <div className={css.blur2}></div>

            <div className={css.content}>
                <h1 className={css.titulo}>
                    Olá, <span>Usuário</span>
                </h1>

                <p className={css.subtitulo}>
                    Você está logado com sucesso
                </p>

                <div className={css.illustration}>
                    <img src="/nuvem.png" alt="Sucesso" />
                </div>
            </div>

        </div>
    );
}