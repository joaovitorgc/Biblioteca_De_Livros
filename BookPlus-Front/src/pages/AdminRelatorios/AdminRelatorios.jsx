import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import estilos from './AdminRelatorios.module.css';

// Importações dos componentes compartilhados
import AbasNavegacao from "../../components/AbasNavegacao/AbasNavegacao.jsx";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica.jsx";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";

// Subcomponente modular para os Cards de Relatório
function CartaoRelatorio({ titulo, descricao, icon, onClick, baixando }) {
    return (
        <div className={estilos.relatorioCard}>
            <div className={estilos.relatorioIcone}>{icon}</div>
            <div className={estilos.relatorioInfo}>
                <h3>{titulo}</h3>
                <p>{descricao}</p>
                <button
                    className={estilos.btnDownload}
                    onClick={onClick}
                    disabled={baixando}
                >
                    {baixando ? "Gerando PDF..." : "Gerar Relatório (PDF)"}
                </button>
            </div>
        </div>
    );
}

export default function AdminRelatorios() {
    const navigate = useNavigate();

    // Estados para controle de dados e estatísticas
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [totalLivros, setTotalLivros] = useState(0);
    const [totalReservas, setTotalReservas] = useState(0);

    // Estados para controle de UI
    const [baixandoRelatorio, setBaixandoRelatorio] = useState({});
    const [mensagem, setMensagem] = useState("");
    const [tipo, setTipo] = useState("");

    const dadosEstatisticas = [
        { id: 1, titulo: "Total De Reservas", valor: totalReservas },
        { id: 2, titulo: "Usuários Cadastrados", valor: totalUsuarios },
        { id: 3, titulo: "Livros Cadastrados", valor: totalLivros }
    ];

    // Configuração dos relatórios disponíveis na página
    const listaRelatorios = [
        {
            id: 'livros_mais_emprestados',
            titulo: 'Livros Mais Emprestados',
            descricao: 'Exibe o ranking dos livros com maior saída na biblioteca, ordenados por quantidade de empréstimos.',
            icon: '📊'
        },
        {
            id: 'emprestimos_por_mes',
            titulo: 'Empréstimos por Mês',
            descricao: 'Histórico mensal de retiradas acompanhado de um gráfico de barras comparativo dos últimos 12 meses.',
            icon: '📅'
        },
        {
            id: 'usuarios_nao_buscam',
            titulo: 'Usuários Suspensos / Desistências',
            descricao: 'Lista usuários que efetuaram reservas no sistema, mas não compareceram para buscar os livros no prazo.',
            icon: '⚠️'
        }
    ];

    const handleMudarAba = (aba) => {
        if (aba === 'Relatórios') return;

        const rotas = {
            'Usuários': '/AdminUsuarios',
            'Livros': '/AdminLivros',
            'Empréstimos': '/AdminEmprestimos'
        };

        navigate(rotas[aba] || '/');
    };

    // Buscas de estatísticas para manter o topo idêntico à página de empréstimos
    async function buscarUsuarios() {
        try {
            let resposta = await fetch("http://127.0.0.1:5000/listar_usuarios", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            resposta = await resposta.json();
            setTotalUsuarios(resposta.total_usuarios || 0);
        } catch (erro) {
            console.error("Erro ao buscar usuários:", erro);
        }
    }

    async function buscarLivros() {
        try {
            let resposta = await fetch("http://127.0.0.1:5000/listar_livros");
            resposta = await resposta.json();
            setTotalLivros(resposta.total_livros || 0);
        } catch (erro) {
            console.error("Erro ao buscar livros:", erro);
        }
    }

    async function buscarTotalReservas() {
        try {
            const resposta = await fetch('http://127.0.0.1:5000/listar_emprestimos', {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();
            setTotalReservas(dados.emprestimos ? dados.emprestimos.length : 0);
        } catch (erro) {
            console.error("Erro ao buscar empréstimos:", erro);
        }
    }

    async function handleBaixarRelatorio(endpoint, idRelatorio) {
        try {
            // Ativa o loading exclusivo do botão clicado
            setBaixandoRelatorio(prev => ({ ...prev, [idRelatorio]: true }));

            const resposta = await fetch(`http://127.0.0.1:5000/relatorio/${endpoint}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!resposta.ok) {
                const dadosErro = await resposta.json();
                throw new Error(dadosErro.error || 'Falha ao gerar o documento');
            }

            // Processa o binário do PDF recebido do Flask
            const blob = await resposta.blob();
            const url = window.URL.createObjectURL(blob);

            // Força o download do arquivo no navegador
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_${endpoint}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Limpeza de memória
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setMensagem("Relatório gerado e baixado com sucesso!");
            setTipo("sucesso");
        } catch (erro) {
            console.error(erro);
            setMensagem(erro.message || "Erro ao conectar com o servidor para gerar relatório.");
            setTipo("erro");
        } finally {
            setBaixandoRelatorio(prev => ({ ...prev, [idRelatorio]: false }));
        }
    }

    useEffect(() => {
        buscarUsuarios();
        buscarLivros();
        buscarTotalReservas();
    }, []);

    return (
        <main className={estilos.container}>
            <FlashMessage
                mensagem={mensagem}
                tipo={tipo}
                onClose={() => setMensagem("")}
            />

            <h1 className={estilos.tituloPagina}>
                Página Administrador
            </h1>

            <div className={estilos.gradeEstatisticas}>
                {dadosEstatisticas.map((dado) => (
                    <CartaoEstatistica
                        key={dado.id}
                        titulo={dado.titulo}
                        valor={dado.valor}
                    />
                ))}
            </div>

            <AbasNavegacao
                abas={['Usuários', 'Livros', 'Relatórios', 'Empréstimos']}
                abaAtiva="Relatórios"
                aoMudarAba={handleMudarAba}
            />

            <div className={estilos.secaoRelatorios}>
                <h2 className={estilos.subtitulo}>Central de Relatórios Gerenciais</h2>
                <p className={estilos.descricaoSecao}>
                    Selecione uma das opções abaixo para realizar a exportação dos dados consolidados em formato PDF.
                </p>

                <div className={estilos.gradeRelatorios}>
                    {listaRelatorios.map((relatorio) => (
                        <CartaoRelatorio
                            key={relatorio.id}
                            titulo={relatorio.titulo}
                            descricao={relatorio.descricao}
                            icon={relatorio.icon}
                            baixando={baixandoRelatorio[relatorio.id]}
                            onClick={() => handleBaixarRelatorio(relatorio.id, relatorio.id)}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}