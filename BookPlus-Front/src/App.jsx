import Header from "./components/Header/Header.jsx";
import CardLivro from "./components/Card/CardLivro.jsx";
import Banner from "./components/Banner/Banner.jsx";
function App() {

    return (
        <>
        <Header />

            <Banner />

            <CardLivro
                imagem="/oPrincipe.jpg"
                titulo="O Príncipe"
                autor="Nicolau Maquiável"
            />

        </>
    )
}

export default App