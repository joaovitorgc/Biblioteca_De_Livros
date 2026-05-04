import { useState, useEffect } from "react";
import css from "./Banner.module.css";

const series = [
    {
        id: 1,
        imagem: "/got_cut.jpg",
        tag: "FANTASIA",
        titulo: <>"O inverno <br /> está chegando"</>,
        corGradiente: "rgb(54,84,110)",
        imagem_livro: "got_livro.jpg",
        livro_nome: "logo_game_of_thrones.png"
    },
    {
        id: 2,
        imagem: "/jogos.jpg",
        tag: "AÇÃO",
        titulo: <>"Que a sorte esteja <br /> sempre a seu favor"</>,
        corGradiente: "rgb(83,22,22)",
        imagem_livro: "jogos-vorazes-livro.jpg",
        livro_nome: "jogos-vorazes-logo.webp"
    },
    {
        id: 3,
        imagem: "/Poderoso_chefao.jpg",
        tag: "MÁFIA",
        titulo: <>"Não é pessoal, <br /> são apenas negócios"</>,
        corGradiente: "rgba(183, 28, 28, 0.9)",
        imagem_livro: "Poderoso_chefao_livro.jpg",
        livro_nome: "Poderoso_chefao_titulo.jpg"
    },
    {
        id: 4,
        imagem: "/it.jpg",
        tag: "TERROR",
        titulo: <>"Você também <br /> vai flutuar"</>,
        corGradiente: "rgb(186,24,37)",
        imagem_livro: "it-livro.jpg",
        livro_nome: "it-titulo.png"
    }
];

export default function Banner() {
    const [indiceAtual, setIndiceAtual] = useState(0);

    useEffect(() => {
        const intervalo = setInterval(() => {
            setIndiceAtual((indiceAnterior) =>
                indiceAnterior === series.length - 1 ? 0 : indiceAnterior + 1
            );
        }, 4000);

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className={css.bannerContainer}>

            {/* Mapeia e renderiza todos os slides simultaneamente */}
            {series.map((slide, index) => (
                <section
                    key={slide.id}
                    // Aplica a classe 'active' apenas no slide atual
                    className={`${css.banner} ${index === indiceAtual ? css.active : ''}`}
                    style={{
                        backgroundImage: `linear-gradient(to right, ${slide.corGradiente} 10%, rgba(0, 0, 0, 0) 40%), url('${slide.imagem}')`
                    }}
                >
                    <div className="container">
                        <img className={css.nome_livro} src={slide.livro_nome} alt="Nome da obra" />
                        <div className="row">
                            <div className="col-md-6">
                                <div className={css.conteudo}>
                                    <span className={css.tag}>{slide.tag}</span>
                                    <h2 className={css.titulo}>
                                        {slide.titulo}
                                    </h2>
                                    {slide.texto && (
                                        <p className={css.texto}>
                                            {slide.texto}
                                        </p>
                                    )}
                                    <img className={css.imagem_livro} src={slide.imagem_livro} alt="Capa do livro" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {/* Renderiza as "bolinhas" de navegação */}
            <div className={css.dotsContainer}>
                {series.map((_, index) => (
                    <button
                        key={index}
                        className={`${css.dot} ${index === indiceAtual ? css.activeDot : ''}`}
                        onClick={() => setIndiceAtual(index)}
                        aria-label={`Ir para o slide ${index + 1}`}
                    ></button>
                ))}
            </div>

        </div>
    );
}