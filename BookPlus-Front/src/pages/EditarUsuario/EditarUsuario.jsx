import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import estilos from './EditarUsuario.module.css';
import css from "../EditarUsuario/EditarUsuario.module.css";

import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function EditarUsuario() {

    const navigate = useNavigate();
    const location = useLocation();

    const usuario = location.state;

    const [nome, setNome] = useState(usuario?.nome || '');
    const [email, setEmail] = useState(usuario?.email || '');
    const [senha, setSenha] = useState('');

    const [imagem, setImagem] = useState(null);

    const [preview, setPreview] = useState(
        `http://127.0.0.1:5000/uploads/Usuarios/${usuario?.id}.jpg`
    );

    const [mensagemFlash, setMensagemFlash] = useState('');
    const [tipoFlash, setTipoFlash] = useState('');

    async function editarUsuario(e) {

        e.preventDefault();

        if (!nome || !email || !senha) {

            setMensagemFlash('Preencha todos os campos.');
            setTipoFlash('erro');

            return;
        }

        try {

            const formData = new FormData();

            formData.append('nome', nome);
            formData.append('email', email);
            formData.append('senha', senha);

            if (imagem) {
                formData.append('imagem', imagem);
            }

            const response = await fetch(
                `http://localhost:5000/editar_usuario/${usuario.id}`,
                {
                    method: 'PUT',
                    body: formData,
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (response.ok) {

                setMensagemFlash(data.message);
                setTipoFlash('sucesso');

                setTimeout(() => {
                    navigate('/AdminUsuarios');
                }, 1500);

            } else {

                setMensagemFlash(data.error || data.message);
                setTipoFlash('erro');
            }

        } catch (erro) {

            console.log(erro);

            setMensagemFlash('Erro ao conectar com o servidor.');
            setTipoFlash('erro');
        }
    }

    function selecionarImagem(e) {

        const arquivo = e.target.files[0];

        if (arquivo) {

            setImagem(arquivo);

            setPreview(URL.createObjectURL(arquivo));
        }
    }

    return (

        <div className={estilos.containerPagina}>

            <FlashMessage
                mensagem={mensagemFlash}
                tipo={tipoFlash}
                onClose={() => setMensagemFlash('')}
            />

            <form
                className={estilos.formulario}
                onSubmit={editarUsuario}
            >

                <div className={estilos.areaFotoContainer}>

                    <label className={estilos.textoFoto}>
                        Foto de Perfil
                    </label>

                    <label className={estilos.areaImagem}>

                        {
                            preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className={estilos.previewImagem}
                                />
                            ) : (
                                <img
                                    src="/icone_foto.png"
                                    className={css.iconeUpload}
                                />
                            )
                        }

                        <input
                            type="file"
                            accept="image/*"
                            onChange={selecionarImagem}
                            className={estilos.inputImagem}
                        />

                    </label>

                </div>

                <div className={estilos.areaInputs}>

                    <div className={estilos.grupoInput}>

                        <label>Nome</label>

                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Senha</label>

                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />

                    </div>

                    <button
                        type="submit"
                        className={estilos.botaoConfirmar}
                    >
                        CONFIRMAR
                    </button>

                </div>

            </form>

        </div>
    );
}