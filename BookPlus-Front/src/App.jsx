import Header from "./components/Header/Header.jsx";
import Home from "./pages/Home.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Footer from "./components/Footer/Footer.jsx";
import Login from "./pages/Login/Login.jsx";
function App() {



    return (
        <BrowserRouter>

            <Header />
            <Routes>
                <Route path="/" element={ <Home/> } />
                <Route path="/Login" element={ <Login/> } />
            </Routes>
            <Footer/>

        </BrowserRouter>
    )
}

export default App