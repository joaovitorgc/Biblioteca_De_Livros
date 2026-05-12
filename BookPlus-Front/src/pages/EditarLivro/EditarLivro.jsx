import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import estilos from './EditarLivro.module.css';
import css from "../Cadastro/Cadastro.module.css";

import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

export default function EditarLivro() {

    const navigate = useNavigate();
    const location = useLocation();

    const livro = location.state;

    const [titulo, setTitulo] = useState(livro?.titulo || '');
    const [autor, setAutor] = useState(livro?.autor || '');
    const [genero, setGenero] = useState(livro?.genero || '');
    const [anoPublicacao, setAnoPublicacao] = useState(livro?.ano_publicacao || '');
    const [estoque, setEstoque] = useState(livro?.estoque || '');

    const [imagem, setImagem] = useState(null);

    const [preview, setPreview] = useState(
        livro?.imagem || `/uploads/Livros/${livro?.id_livro}.jpg`
    );

    const [mensagemFlash, setMensagemFlash] = useState('');
    const [tipoFlash, setTipoFlash] = useState('');

    async function editarLivro(e) {

        e.preventDefault();

        if (!titulo || !autor || !genero || !anoPublicacao || !estoque) {

            setMensagemFlash('Preencha todos os campos.');
            setTipoFlash('erro');

            return;
        }

        if (Number(estoque) < 1) {

            setMensagemFlash('O estoque mínimo é 1 livro 📚');
            setTipoFlash('erro');

            return;
        }

        try {

            const formData = new FormData();

            formData.append('titulo', titulo);
            formData.append('autor', autor);
            formData.append('genero', genero);
            formData.append('ano_publicacao', anoPublicacao);
            formData.append('estoque', estoque);

            if (imagem) {
                formData.append('imagem', imagem);
            }

            const response = await fetch(
                `http://127.0.0.1:5000/editar_livro/${livro.id_livro}`,
                {
                    method: 'PUT',
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {

                setMensagemFlash(data.mensagem);
                setTipoFlash('sucesso');

                setTimeout(() => {
                    navigate('/AdminLivros');
                }, 1500);

            } else {

                setMensagemFlash(data.error);
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
                onSubmit={editarLivro}
            >

                <label className={estilos.areaImagem}>

                    {
                        preview ? (
                            <img
                                src={`http://127.0.0.1:5000/uploads/Livros/${livro.id_livro}.jpg`}                                alt="Preview"
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

                <div className={estilos.areaInputs}>

                    <div className={estilos.grupoInput}>
                        <label>Título</label>

                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                        />
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>Autor</label>

                        <input
                            type="text"
                            value={autor}
                            onChange={(e) => setAutor(e.target.value)}
                        />
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>Gênero</label>

                        <input
                            type="text"
                            value={genero}
                            onChange={(e) => setGenero(e.target.value)}
                        />
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>Ano de Publicação</label>

                        <input
                            type="text"
                            value={anoPublicacao}
                            onChange={(e) => {

                                const valor = e.target.value;

                                if (/^\d*$/.test(valor)) {
                                    setAnoPublicacao(valor);
                                }
                            }}
                        />
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>Estoque</label>

                        <input
                            type="text"
                            value={estoque}
                            onChange={(e) => {

                                const valor = e.target.value;

                                if (/^\d*$/.test(valor)) {
                                    setEstoque(valor);
                                }
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className={estilos.botaoCadastrar}
                    >
                        SALVAR
                    </button>

                </div>

            </form>

        </div>
    );
}