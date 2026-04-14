import { useState, useEffect } from "react";
import css from "./Banner.module.css";


const series = [
    {
        id: 1,
        imagem: "/got.webp",
        tag: "FANTASIA",
        titulo: <>Descubra seu <br /> próximo capítulo</>,
        corGradiente: "rgb(54,84,110)",
        imagem_livro: "got_livro.jpg",
        livro_nome: "logo_game_of_thrones.png"
    },
    // {
    //     id: 2,
    //     imagem: "/twd.webp",
    //     tag: "APOCALIPSE",
    //     titulo: <>O Fim <br /> Chegou</>,
    //     corGradiente: "rgba(27,88,67,0.9)"
    // },
    // {
    //     id: 3,
    //     imagem: "/st.jpg",
    //     tag: "FICÇÃO CIENTÍFICA",
    //     titulo: <>Mundo <br /> Invertido</>,
    //     corGradiente: "rgba(183, 28, 28, 0.9)"
    // }
];

export default function Banner() {
    const [indiceAtual, setIndiceAtual] = useState(0);


    useEffect(() => {
        const intervalo = setInterval(() => {
            setIndiceAtual((indiceAnterior) =>
                indiceAnterior === series.length - 1 ? 0 : indiceAnterior + 1
            );
        }, 4000); // 4000 milissegundos = 4 segundos

        return () => clearInterval(intervalo); // Limpa o intervalo se o componente for desmontado
    }, []);

    const slide = series[indiceAtual];

    return (
        <section
            className={css.banner}
            //Imagem e o gradiente dinamicamente via style inline
            style={{
                backgroundImage: `linear-gradient(to right, ${slide.corGradiente} 10%, rgba(0, 0, 0, 0) 40%), url('${slide.imagem}')`
            }}
        >
            <div className="container">
                <img className={css.nome_livro} src={slide.livro_nome}/>
                <div className="row">
                    <div className="col-md-6">
                        <div className={css.conteudo}>
                            <span className={css.tag}>{slide.tag}</span>
                            <h2 className={css.titulo}>
                                {slide.titulo}
                            </h2>
                            <p className={css.texto}>
                                {slide.texto}
                            </p>
                            <img className={css.imagem_livro} src={slide.imagem_livro}  />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}