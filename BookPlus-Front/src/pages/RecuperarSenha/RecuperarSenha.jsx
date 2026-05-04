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

    // ETAPA 2: Gerenciar digitação do código
    const handleCodigoChange = (element, index) => {
        if (isNaN(element.value)) return; // Aceita apenas números

        const novoCodigo = [...codigo];
        novoCodigo[index] = element.value;
        setCodigo(novoCodigo);

        // Pula para o próximo input automaticamente
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const confirmarCodigo = (e) => {
        e.preventDefault();
        const codigoCompleto = codigo.join("");
        if (codigoCompleto.length < 6) {
            setMensagem("Preencha todos os 6 dígitos do código.");
            setTipo("erro");
            return;
        }
        setEtapa(3); // Avança para a tela de nova senha
    };

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
                                        onChange={(e) => handleCodigoChange(e.target, index)}
                                        onFocus={(e) => e.target.select()}
                                        className={estilos.inputCaixinha}
                                    />
                                ))}
                            </div>

                            <button type="submit" className={estilos.botaoPreto}>
                                CONFIRMAR
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