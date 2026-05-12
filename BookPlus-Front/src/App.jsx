import Header from "./components/Header/Header.jsx";
import Home from "./pages/Home.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Footer from "./components/Footer/Footer.jsx";
import Login from "./pages/Login/Login.jsx";
import Cadastro from "./pages/Cadastro/Cadastro.jsx";
import ValidarEmail from "./pages/validarEmail/validarEmail.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import RecuperarSenha from "./pages/RecuperarSenha/RecuperarSenha.jsx";
import AdminUsuarios from "./pages/AdminUsuarios/AdminUsuarios.jsx";
import AdminLivros from "./pages/AdminLivros/AdminLivros.jsx";
import CadastroLivro from "./pages/CadastroLivro/CadastroLivro.jsx";
import EditarLivro from "./pages/EditarLivro/EditarLivro.jsx";
function App() {


    return (
        <BrowserRouter>

            <Header />
            <Routes>
                <Route path="/" element={ <Home/> } />
                <Route path="/Login" element={ <Login /> } />
                <Route path="/cadastro" element={ <Cadastro/> } />
                <Route path="/ValidarEmail" element={ <ValidarEmail/> } />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/AdminUsuarios" element={<AdminUsuarios />} />
                <Route path="/RecuperarSenha" element={ <RecuperarSenha/> } />
                <Route path="/AdminLivros" element={<AdminLivros />} />
                <Route path="/cadastrolivro" element={<CadastroLivro />} />
                <Route path="/editar-livro" element={<EditarLivro />} />
            </Routes>
            <Footer/>

        </BrowserRouter>
    )
}

export default App