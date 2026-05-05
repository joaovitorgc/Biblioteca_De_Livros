import React, { useState, useRef } from 'react';
import estilos from './RecuperarSenha.module.css';
import { useNavigate } from 'react-router-dom';
import FlashMessage from '../../components/FlashMessage/FlashMessage.jsx';

export default function RecuperarSenha() {
    const navigate = useNavigate();

    // Estados gerais
    const [etapa, setEtapa] = useState(1);
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");
    const [carregando, setCarregando] = useState(false);

    // Dados do formulário
    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState(new Array(6).fill(""));
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    // Referências para os inputs de código (para o foco automático)
    const inputRefs = useRef([]);

    // ETAPA 1: Enviar Email
    async function solicitarCodigo(e) {
        e.preventDefault();
        if (!email) {
            setMensagem("Por favor, digite seu email.");
            setTipo("erro");
            return;
        }

        setCarregando(true);
        try {
            const resposta = await fetch("http://localhost:5000/recuperar_senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("Código enviado para o seu email!");
                setTipo("sucesso");
                setEtapa(2); // Avança para a tela do código
            } else {
                setMensagem(dados.error || "Erro ao solicitar código.");
                setTipo("erro");
            }
        } catch {
            setMensagem("Erro ao conectar com o servidor.");
            setTipo("erro");
        } finally {
            setCarregando(false);
        }
    }

    const handleCodigoChange = (valor, index) => {
        if (isNaN(valor)) return; // Aceita apenas números

        const novoCodigo = [...codigo];
        novoCodigo[index] = valor.substring(valor.length - 1);
        setCodigo(novoCodigo);

        // Pula para o próximo quadrado automaticamente se digitar algo
        if (valor !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // 2. Apagar código rápido
    const handleKeyDown = (e, index) => {
        // Se apertar pra apagar e o quadrado atual já estiver vazio, volta o foco pra anterior
        if (e.key === "Backspace" && codigo[index] === "" && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    // 3. Colar código (Paste)
    const handlePaste = (e) => {
        e.preventDefault(); // Impede de colar tudo em uma caixinha só
        const textoColado = e.clipboardData.getData("text");

        // Remove qualquer coisa que não seja número e corta no máximo 6 dígitos
        const numeros = textoColado.replace(/\D/g, "").slice(0, 6);

        if (numeros.length > 0) {
            const novoCodigo = [...codigo];

            // Distribui os números colados nas caixinhas
            for (let i = 0; i < numeros.length; i++) {
                novoCodigo[i] = numeros[i];
            }
            setCodigo(novoCodigo);

            // Joga o foco pra última caixinha que foi preenchida
            const indexParaFocar = numeros.length < 6 ? numeros.length : 5;
            inputRefs.current[indexParaFocar].focus();
        }
    };



    // ETAPA 2: Confirmar Código com o Backend antes de ir para a etapa 3
    async function confirmarCodigo(e) {
        e.preventDefault();
        const codigoCompleto = codigo.join("");

        if (codigoCompleto.length < 6) {
            setMensagem("Preencha todos os 6 dígitos do código.");
            setTipo("erro");
            return;
        }

        setCarregando(true);
        try {
            const resposta = await fetch("http://localhost:5000/recuperar_senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    codigo: codigoCompleto
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("Código verificado!");
                setTipo("sucesso");
                setEtapa(3);
            } else {
                setMensagem(dados.error || "Código inválido.");
                setTipo("erro");
            }
        } catch {
            setMensagem("Erro ao conectar com o servidor.");
            setTipo("erro");
        } finally {
            setCarregando(false);
        }
    }

    // ETAPA 3: Redefinir a Senha
    async function redefinirSenha(e) {
        e.preventDefault();

        if (novaSenha !== confirmarSenha) {
            setMensagem("As senhas não coincidem.");
            setTipo("erro");
            return;
        }

        setCarregando(true);
        try {
            const resposta = await fetch("http://localhost:5000/recuperar_senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    codigo: codigo.join(""),
                    nova_senha: novaSenha
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setMensagem("Senha redefinida com sucesso!");
                setTipo("sucesso");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMensagem(dados.error);
                setTipo("erro");
            }
        } catch {
            setMensagem("Erro ao conectar com o servidor.");
            setTipo("erro");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <>
            <FlashMessage mensagem={mensagem} tipo={tipo} onClose={() => setMensagem("")} />

            <div className={estilos.containerFundo}>
                <div className={estilos.cartaoBranco}>

                    {/* --- TELA 1: SOLICITAR EMAIL --- */}
                    {etapa === 1 && (
                        <form onSubmit={solicitarCodigo} className={estilos.formulario}>
                            <h2 className={estilos.titulo}>Recuperar Senha</h2>
                            <p className={estilos.subtitulo}>Digite seu email para receber o código de verificação.</p>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={estilos.inputTexto}
                            />

                            <button type="submit" className={estilos.botaoPreto} disabled={carregando}>
                                {carregando ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
                            </button>
                        </form>
                    )}

                    {/* --- TELA 2: DIGITAR CÓDIGO --- */}
                    {etapa === 2 && (
                        <form onSubmit={confirmarCodigo} className={estilos.formulario}>
                            <h2 className={estilos.titulo}>Digite o código Para recuperar sua Senha</h2>

                            <div className={estilos.containerCodigo}>
                                {codigo.map((dado, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={dado}
                                        ref={(el) => inputRefs.current[index] = el}
                                        onChange={(e) => handleCodigoChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onPaste={handlePaste}
                                        onFocus={(e) => e.target.select()}
                                        className={estilos.inputCaixinha}
                                    />
                                ))}
                            </div>

                            <button type="submit" className={estilos.botaoPreto} disabled={carregando}>
                                {carregando ? "VERIFICANDO..." : "CONTINUAR"}
                            </button>
                        </form>
                    )}

                    {/* --- TELA 3: NOVA SENHA --- */}
                    {etapa === 3 && (
                        <form onSubmit={redefinirSenha} className={estilos.formulario}>
                            <h2 className={estilos.titulo}>Digite a sua Nova Senha</h2>

                            <div className={estilos.grupoInput}>
                                <label className={estilos.label}>Nova Senha</label>
                                <input
                                    type="password"
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    className={estilos.inputTexto}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label className={estilos.label}>Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    className={estilos.inputTexto}
                                />
                            </div>

                            <button type="submit" className={estilos.botaoPreto} disabled={carregando}>
                                {carregando ? "SALVANDO..." : "CONFIRMAR"}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </>
    );
}