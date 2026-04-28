import { useState } from "react";
import css from "./Cadastro.module.css";
import { Link } from "react-router-dom";

export default function Cadastro() {

    const [foto, setFoto] = useState(null);

    function handleFotoChange(e) {
        const file = e.target.files[0];
        if (file) {
            setFoto(URL.createObjectURL(file));
        }
    }

    return (
        <div className={css.containerPrincipal}>

            <div className={css.painelEsquerdo}>
                <div className={css.cartaoCadastro}>
                    <h1 className={css.titulo}>Conclua seu Cadastro</h1>

                    <form className={css.formulario}>

                        <div className={css.grupoEntrada}>
                            <label>Nome</label>
                            <input type="text" />
                        </div>

                        <div className={css.grupoEntrada}>
                            <label>Email</label>
                            <input type="email" />
                        </div>

                        <div className={css.grupoEntrada}>
                            <label>Senha</label>
                            <input type="password" />
                        </div>

                        <div className={css.grupoEntrada}>
                            <label>Confirmar Senha</label>
                            <input type="password" />
                        </div>

                        <div className={css.fotoContainer}>
                            <label className={css.labelFoto}>Foto de Perfil</label>

                            <label className={css.caixaFoto}>
                                {foto ? (
                                    <img src={foto} alt="Preview" className={css.previewFoto} />
                                ) : (
                                    <img src="/icone_foto.png" className={css.iconeUpload} />
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFotoChange}
                                    className={css.inputFile}
                                />
                            </label>
                        </div>

                        <Link to="/proxima-etapa" className={css.botaoAvancar}>
                            AVANÇAR
                        </Link>

                        <p className={css.loginLink}>
                            Já possui cadastro? <Link to="/login">Entre Agora</Link>
                        </p>

                    </form>
                </div>
            </div>

            <div className={css.painelDireito}>
                <img
                    src="/oPrincipe.jpg"
                    alt="Livro O Príncipe"
                    className={css.imagemLivro}
                />
            </div>

        </div>
    );
}