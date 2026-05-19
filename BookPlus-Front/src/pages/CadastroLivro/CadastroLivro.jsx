import { useState } from 'react';
import estilos from './CadastroLivro.module.css';
import css from "../Cadastro/Cadastro.module.css";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";
import { useNavigate } from "react-router-dom";

export default function CadastroLivro() {

    const navigate = useNavigate();

    const [titulo, setTitulo] = useState('');
    const [autor, setAutor] = useState('');
    const [genero, setGenero] = useState('');
    const [anoPublicacao, setAnoPublicacao] = useState('');
    const [estoque, setEstoque] = useState('');
    const [descricao, setDescricao] = useState('');

    const [imagem, setImagem] = useState(null);
    const [preview, setPreview] = useState(null);

    const [mensagemFlash, setMensagemFlash] = useState('');
    const [tipoFlash, setTipoFlash] = useState('');

    async function cadastrarLivro(e) {

        e.preventDefault();

        if (
            !titulo
            || !autor
            || !genero
            || !anoPublicacao
            || !estoque
            || !descricao
        ) {

            setMensagemFlash(
                'Preencha todos os campos.'
            );

            setTipoFlash('erro');

            return;
        }

        if (Number(estoque) < 1) {

            setMensagemFlash(
                'O estoque mínimo é 1 livro 📚'
            );

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
            formData.append('descricao', descricao);

            if (imagem) {

                formData.append(
                    'imagem',
                    imagem
                );
            }

            const response = await fetch(
                'http://127.0.0.1:5000/cadastrar_livro',
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {

                setMensagemFlash(
                    data.mensagem
                    || 'Livro cadastrado com sucesso!'
                );

                setTipoFlash('sucesso');

                setTitulo('');
                setAutor('');
                setGenero('');
                setAnoPublicacao('');
                setEstoque('');
                setDescricao('');

                setImagem(null);
                setPreview(null);

                setTimeout(() => {

                    navigate("/AdminLivros");

                }, 1500);

            } else {

                setMensagemFlash(
                    data.error
                    || 'Erro ao cadastrar livro.'
                );

                setTipoFlash('erro');

            }

        } catch (erro) {

            console.log(erro);

            setMensagemFlash(
                'Erro ao conectar com o servidor.'
            );

            setTipoFlash('erro');
        }
    }

    function selecionarImagem(e) {

        const arquivo = e.target.files[0];

        if (arquivo) {

            setImagem(arquivo);

            setPreview(
                URL.createObjectURL(arquivo)
            );
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
                onSubmit={cadastrarLivro}
            >

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

                <div className={estilos.areaInputs}>

                    <div className={estilos.grupoInput}>

                        <label>Título</label>

                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) =>
                                setTitulo(e.target.value)
                            }
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Autor</label>

                        <input
                            type="text"
                            value={autor}
                            onChange={(e) =>
                                setAutor(e.target.value)
                            }
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Gênero</label>

                        <input
                            type="text"
                            value={genero}
                            onChange={(e) =>
                                setGenero(e.target.value)
                            }
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>
                            Ano de Publicação
                        </label>

                        <input
                            type="number"
                            value={anoPublicacao}
                            min={1}
                            onChange={(e) =>
                                setAnoPublicacao(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Estoque</label>

                        <input
                            type="number"
                            value={estoque}
                            min={1}
                            onChange={(e) =>
                                setEstoque(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className={estilos.grupoInput}>

                        <label>Descrição</label>

                        <textarea
                            value={descricao}
                            onChange={(e) =>
                                setDescricao(e.target.value)
                            }
                            rows={5}
                            placeholder="Digite uma descrição do livro..."
                            className={estilos.textarea}
                        />

                    </div>

                    <button
                        type="submit"
                        className={estilos.botaoCadastrar}
                    >
                        ADICIONAR
                    </button>

                </div>

            </form>

        </div>
    );
}