import Header from "./components/Header/Header.jsx";
import Home from "./pages/Home.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Footer from "./components/Footer/Footer.jsx";
function App() {



    return (
        <BrowserRouter>

            <Header />
            <Routes>
                <Route path="/" element={ <Home/> } />
            </Routes>
            <Footer/>

        </BrowserRouter>
    )
}

export default App