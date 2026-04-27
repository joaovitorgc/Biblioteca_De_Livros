import Banner from "../components/Banner/Banner.jsx";
import ListaLivros from "../components/ListaLivros/ListaLivros.jsx";

export default function Home(){

    const meusLivros = [
        {
            id: 1,
            titulo: 'O Príncipe',
            autor: 'Nicolau Maquiável',
            imagem: "oPrincipe.jpg"
        },
        {
            id: 2,
            titulo: 'O Poderoso Chefão',
            autor: 'Mario Puzo',
            imagem: "Poderoso_chefao_livro.jpg"
        },
        {
            id: 3,
            titulo: 'IT',
            autor: 'Stephen King',
            imagem: "it-livro.jpg"
        },
        {
            id: 4,
            titulo: 'Jogos Vorazes',
            autor: 'Suzanne Collins',
            imagem: "jogos-vorazes-livro.jpg"
        },
    ];

    return (
        <>
            <Banner />

            <ListaLivros livros={meusLivros} />
        </>
    )
}