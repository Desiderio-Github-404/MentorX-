import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  GraduationCap,
  Library,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";

const features = [
  {
    icon: Library,
    title: "Biblioteca académica",
    description: "Solucionários, slides, resumos e materiais de apoio organizados por classe e disciplina.",
    label: "Aprende ao teu ritmo",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Partilha dúvidas, participa em discussões e aprende directamente com professores e colegas.",
    label: "Aprende em conjunto",
  },
  {
    icon: Bot,
    title: "MentorX AI",
    description: "Um tutor inteligente para explicar conceitos, orientar exercícios e apoiar o teu estudo.",
    label: "Aprendizagem inteligente",
  },
];

const subjects = ["Matemática", "Física", "Electrónica", "Informática", "Telecomunicações", "Química"];

export default function App() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={dark ? "app-shell dark" : "app-shell light"}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="MentorX início">
          <span className="brand-mark">M<span>.</span></span>
          <span>Mentor<span className="brand-accent">X</span></span>
        </a>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a>
          <a href="#disciplinas" onClick={() => setMenuOpen(false)}>Disciplinas</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
        </nav>

        <div className="top-actions">
          <button className="icon-button theme-toggle" onClick={() => setDark(!dark)} aria-label="Alternar tema">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="login-link" href="#entrar">Entrar</a>
          <a className="button button-small" href="#comecar">Começar <ArrowRight size={16} /></a>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="sobre">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> O teu próximo nível começa aqui</div>
            <h1>Aprender melhor.<br /><span>Chegar mais longe.</span></h1>
            <p className="hero-description">
              Um espaço para estudar com orientação, encontrar materiais de qualidade e crescer com uma comunidade que partilha o mesmo objectivo.
            </p>
            <div className="hero-actions" id="comecar">
              <a className="button" href="#recursos">Explorar a MentorX <ArrowRight size={17} /></a>
              <a className="secondary-link" href="#disciplinas">Conhecer disciplinas</a>
            </div>
            <div className="hero-proof">
              <div className="proof-icon"><GraduationCap size={19} /></div>
              <p><strong>Conhecimento que te acompanha.</strong><br /><span>Estuda, pratica e evolui todos os dias.</span></p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Pré-visualização conceptual da plataforma">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-card card-main">
              <div className="card-topline"><span className="live-dot" /> PAINEL DE APRENDIZAGEM</div>
              <div className="study-symbol"><BookOpen size={30} /></div>
              <h3>O conhecimento abre caminhos.</h3>
              <p>O teu espaço académico, num só lugar.</p>
              <div className="progress-track"><span /></div>
              <div className="progress-caption"><span>Ritmo de aprendizagem</span><strong>Em evolução</strong></div>
            </div>
            <div className="floating-card mini-card mini-ai"><Bot size={19} /><span>MentorX AI</span><Sparkles size={15} /></div>
            <div className="floating-card mini-card mini-community"><MessageCircle size={18} /><span>Comunidade activa</span></div>
            <div className="visual-glow" />
          </div>
        </section>

        <section className="feature-section section-wrap" id="recursos">
          <div className="section-heading">
            <span className="section-kicker">UM ECOSSISTEMA DE APRENDIZAGEM</span>
            <h2>Mais do que estudar.<br /><span>É evoluir com estrutura.</span></h2>
            <p>Ferramentas pensadas para transformar esforço em conhecimento.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, description, label }) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon"><Icon size={22} /></div>
                <span className="feature-label">{label}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature-arrow"><ArrowRight size={18} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="subjects-section section-wrap" id="disciplinas">
          <div className="subjects-heading">
            <div>
              <span className="section-kicker">CONHECIMENTO SEM FRONTEIRAS</span>
              <h2>Explora as tuas disciplinas</h2>
            </div>
            <div className="search-pill"><Search size={16} /><span>Encontra a tua área</span></div>
          </div>
          <div className="subject-list">
            {subjects.map((subject, index) => <span className="subject-chip" key={subject}>{String(index + 1).padStart(2, "0")} <b>{subject}</b><ArrowRight size={15} /></span>)}
          </div>
        </section>

        <section className="closing-cta section-wrap">
          <div><span className="section-kicker">O TEU FUTURO COMEÇA COM UMA DECISÃO</span><h2>O próximo passo é teu.</h2><p>Constrói conhecimento. Desenvolve competências. Vai mais longe.</p></div>
          <a className="button" href="#comecar">Começar agora <ArrowRight size={17} /></a>
        </section>
      </main>

      <footer className="footer"><a className="brand" href="#"><span className="brand-mark">M<span>.</span></span><span>Mentor<span className="brand-accent">X</span></span></a><span>© {new Date().getFullYear()} MentorX. Conhecimento que transforma.</span><span>Feito para aprender e evoluir.</span></footer>
    </div>
  );
}
