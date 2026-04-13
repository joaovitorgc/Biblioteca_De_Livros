import Header from "./components/Header/Header.jsx";
import CardLivro from "./components/Card/CardLivro.jsx";
function App() {

    return (
        <>
        <Header />

            <CardLivro
                imagem="/oPrincipe.jpg"
                titulo="O Príncipe"
                autor="Nicolau Maquiável"
            />

        </>
    )
}

export default App