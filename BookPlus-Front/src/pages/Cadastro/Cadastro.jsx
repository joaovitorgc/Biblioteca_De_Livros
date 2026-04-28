import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import css from "./Cadastro.module.css";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function Cadastro() {
    const [foto, setFoto] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const navigate = useNavigate();

    function handleFotoChange(e) {
        const file = e.target.files[0];

        if (file) {
            setFoto(URL.createObjectURL(file));
        }
    }

    async function cadastrarUsuario(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        try {
            const resposta = await fetch("http://localhost:5000/cadastro", {
                method: "POST",
                body: formData
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("Email enviado com sucesso!");
                setTipo("sucesso");

                setTimeout(() => {
                    navigate("/ValidarEmail", {
                        state: { email: formData.get("email") }
                    });
                }, 1000);

            } else {
                setMensagem(dados.error || dados.mensagem);
                setTipo("erro");
            }

        } catch (error) {
            setMensagem("Erro ao conectar com a API");
            setTipo("erro");
        }
    }

    return (
        <>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <div className={css.containerPrincipal}>
                <div className={css.painelEsquerdo}>
                    <div className={css.cartaoCadastro}>
                        <h1 className={css.titulo}>Conclua seu Cadastro</h1>

                        <form className={css.formulario} onSubmit={cadastrarUsuario}>

                            <div className={css.grupoEntrada}>
                                <label>Nome</label>
                                <input type="text" name="nome" />
                            </div>

                            <div className={css.grupoEntrada}>
                                <label>Email</label>
                                <input type="email" name="email" />
                            </div>

                            <div className={css.grupoEntrada}>
                                <label>Senha</label>
                                <input type="password" name="senha" />
                            </div>

                            <div className={css.grupoEntrada}>
                                <label>Confirmar Senha</label>
                                <input type="password" name="confirmar_senha" />
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
                                        name="imagem"
                                        accept="image/*"
                                        onChange={handleFotoChange}
                                        className={css.inputFile}
                                    />
                                </label>
                            </div>

                            <button type="submit" className={css.botaoAvancar}>
                                AVANÇAR
                            </button>

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
        </>
    );
}