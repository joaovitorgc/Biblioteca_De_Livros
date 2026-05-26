import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Dashboard.module.css";
import FlashMessage from "../../components/FlashMessage/FlashMessage.jsx";
import AdminUsuarios from "../AdminUsuarios/AdminUsuarios.jsx";

// ─────────────────────────────────────────────
// PERSONAGENS
// ─────────────────────────────────────────────
const PERSONAGENS = [
    { src: "/nuvem.png",    nome: "Kakaroto"    },
    { src: "/invencivel.png",  nome: "Thragg" },
    { src: "/superman.png",   nome: "Superman"   },
    { src: "/homelander.png", nome: "Homelander" }
];

const TRAIL_COLORS_RIGHT = ["#fbbf24", "#c64d0e", "#fbbf24", "#cd1423"];
const TRAIL_COLORS_LEFT  = ["#fbbf24", "#c64d0e", "#fbbf24", "#cd1423"];

export default function Dashboard({ usuario }) {
    const [mensagem, setMensagem]     = useState("");
    const [tipo, setTipo]             = useState("");
    const [flyDir, setFlyDir]         = useState(null);
    const [speedLines, setSpeedLines] = useState(false);
    const [flashing, setFlashing]     = useState(false);
    const [trails, setTrails]         = useState([]);
    const [trailLines, setTrailLines] = useState([]);

    // Novo estado para armazenar o nome do usuário logado
    const [nomeUsuario, setNomeUsuario] = useState("");

    // Troca de personagem
    const [personagemIdx, setPersonagemIdx] = useState(0);
    const [trocando, setTrocando]           = useState(false); // fade entre personagens

    const personagemImgRef = useRef(null);
    const navigate         = useRef(useNavigate()).current;
    const rafRef           = useRef(null);
    const lastPosRef       = useRef(null);
    const trailIdRef       = useRef(0);


    useEffect(() => {
        const usuarioLogado = localStorage.getItem("usuario");
        if (!usuarioLogado) {
            navigate("/login", {
                state: { mensagemLogout: "Acesso negado. Faça login para continuar!", tipo: "erro" }
            });
        } else {
            try {
                const dadosUsuario = JSON.parse(usuarioLogado);
                setNomeUsuario(dadosUsuario.nome || dadosUsuario.username || "Usuário");
            } catch (e) {
                setNomeUsuario(usuarioLogado); 
            }
        }
    }, [navigate]);



    // ── Troca de personagem ao clicar ──
    const trocarPersonagem = useCallback(() => {
        if (flyDir || PERSONAGENS.length <= 1) return;
        setTrocando(true);
        setTimeout(() => {
            setPersonagemIdx(prev => (prev + 1) % PERSONAGENS.length);
            setTrocando(false);
        }, 220);
    }, [flyDir]);

    // ── Rastreamento do rastro via rAF ──
    const startTracking = useCallback((direction) => {
        const colors = direction === "right" ? TRAIL_COLORS_RIGHT : TRAIL_COLORS_LEFT;
        const tick = () => {
            if (!personagemImgRef.current) return;
            const rect = personagemImgRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width  * 0.5;
            const cy = rect.top  + rect.height * 0.55;
            const id = ++trailIdRef.current;
            const color = colors[id % colors.length];

            setTrails(prev => [...prev.slice(-30), { id, x: cx, y: cy, color, size: Math.random() * 10 + 5 }]);

            if (lastPosRef.current) {
                const { x: px, y: py } = lastPosRef.current;
                const dx = cx - px, dy = cy - py;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                if (len > 1) {
                    setTrailLines(prev => [...prev.slice(-25), { id, x: px, y: py, len, angle, color }]);
                }
            }
            lastPosRef.current = { x: cx, y: cy };
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const stopTracking = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        lastPosRef.current = null;
    }, []);

    const handleNavigate = useCallback((destino, direction) => {
        if (flyDir) return;
        setFlyDir(direction);
        setSpeedLines(true);
        startTracking(direction);
        setTimeout(() => { stopTracking(); setFlashing(true); }, 680);
        setTimeout(() => { navigate(destino); }, 1080);
    }, [flyDir, navigate, startTracking, stopTracking]);

    useEffect(() => () => stopTracking(), [stopTracking]);

    if (usuario?.tipo === 0) return <AdminUsuarios />;

    const personagem   = PERSONAGENS[personagemIdx];
    const multiPersonagem = PERSONAGENS.length > 1;

    return (
        <>
            <FlashMessage mensagem={mensagem} tipo={tipo} onClose={() => setMensagem("")} />

            <div className={`${css.flashOverlay} ${flashing ? css.flashIn : ""}`} />

            {/* Rastro: linhas */}
            {trailLines.map(tl => (
                <div key={tl.id} className={css.trailLine} style={{
                    left: tl.x, top: tl.y, width: tl.len,
                    background: `linear-gradient(90deg, ${tl.color}cc, ${tl.color}00)`,
                    transform: `rotate(${tl.angle}deg)`,
                    boxShadow: `0 0 6px 1px ${tl.color}88`,
                }} />
            ))}

            {/* Rastro: pontos */}
            {trails.map(t => (
                <div key={t.id} className={css.trailDot} style={{
                    left: t.x, top: t.y, width: t.size, height: t.size,
                    background: t.color, boxShadow: `0 0 ${t.size * 2.5}px ${t.color}`,
                }} />
            ))}

            <div className={css.container}>
                <div className={css.stars} />
                <div className={css.blur1} />
                <div className={css.blur2} />
                <div className={css.blur3} />
                <div className={`${css.speedLines} ${speedLines ? css.speedLinesActive : ""}`} />

                <div className={css.content}>
                    {/* O nome agora aparece dinamicamente aqui */}
                    <h1 className={css.titulo}>Olá, <span>{nomeUsuario}</span></h1>
                    <p className={css.subtitulo}>Escolha seu destino</p>

                    {/* Personagem */}
                    <div
                        className={`${css.gokuWrap} ${multiPersonagem && !flyDir ? css.gokuWrapClickable : ""}`}
                        onClick={trocarPersonagem}
                        title={multiPersonagem ? "Clique para trocar o personagem" : undefined}
                    >
                        <div className={css.aura} />
                        <img
                            ref={personagemImgRef}
                            src={personagem.src}
                            alt={personagem.nome}
                            className={`
                                ${css.gokuImg}
                                ${trocando ? css.personagemFadeOut : css.personagemFadeIn}
                                ${flyDir === "right" ? css.flyRight : flyDir === "left" ? css.flyLeft : ""}
                            `}
                        />
                        {/* Badge com nome do personagem (só se houver mais de 1) */}
                        {multiPersonagem && !flyDir && (
                            <div className={css.personagemBadge}>
                                {personagem.nome}
                                <span className={css.personagemDots}>
                                    {PERSONAGENS.map((_, i) => (
                                        <span key={i} className={`${css.dot} ${i === personagemIdx ? css.dotAtivo : ""}`} />
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Cards */}
                    <div className={css.cards}>

                        <div
                            className={`${css.card} ${css.cardAcervo}`}
                            onClick={() => handleNavigate("/", "left")}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && handleNavigate("/", "left")}
                            aria-label="Ir para o Acervo"
                        >
                            <div className={css.cardGlow} />
                            <span className={css.cardIcon} aria-hidden="true">📚</span>
                            <p className={css.cardTitle}>Acervo</p>
                            <p className={css.cardSub}>Explorar livros</p>
                        </div>

                        <div
                            className={`${css.card} ${css.cardReservas}`}
                            onClick={() => handleNavigate("/reservasUsuario", "right")}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && handleNavigate("/reservasUsuario", "right")}
                            aria-label="Ir para Minhas Reservas"
                        >
                            <div className={css.cardGlow} />
                            <span className={css.cardIcon} aria-hidden="true">📋</span>
                            <p className={css.cardTitle}>Reservas</p>
                            <p className={css.cardSub}>Minhas solicitações</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}