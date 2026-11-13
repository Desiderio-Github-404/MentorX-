import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight, BookOpen, Bot, GraduationCap, Library, LockKeyhole, Mail,
  Menu, MessageCircle, Moon, Search, Sparkles, Sun, Users, UserRound, X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const features = [
  { icon: Library, title: "Biblioteca académica", description: "Solucionários, slides, resumos e materiais de apoio organizados por classe e disciplina.", label: "Aprende ao teu ritmo" },
  { icon: Users, title: "Comunidade", description: "Partilha dúvidas, participa em discussões e aprende directamente com professores e colegas.", label: "Aprende em conjunto" },
  { icon: Bot, title: "MentorX AI", description: "Um tutor inteligente para explicar conceitos, orientar exercícios e apoiar o teu estudo.", label: "Aprendizagem inteligente" },
];
const subjects = ["Matemática", "Física", "Electrónica", "Informática", "Telecomunicações", "Química"];
type AuthMode = "login" | "register" | "reset" | "update";

export default function App() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    if (recoveryLink) {
      setAuthMode("update");
      setAuthOpen(true);
      setMessage("");
      setError("");
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("update");
        setAuthOpen(true);
        setMessage("");
        setError("");
        setPassword("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setMessage("");
    setError("");
    setPassword("");
    setAuthOpen(true);
    setMenuOpen(false);
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!supabase || !isSupabaseConfigured) {
      setError("A ligação ao Supabase ainda não está configurada neste deployment. Confirma as variáveis Vercel e faz um novo redeploy.");
      return;
    }
    setBusy(true);
    try {
      if (authMode === "register") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (authError) throw authError;
        setMessage(data.session
          ? "Conta criada com sucesso. Já podes começar a utilizar a MentorX."
          : "Conta criada. Verifica a tua caixa de entrada e confirma o endereço de e-mail antes de iniciares sessão.");
        setAuthMode("login");
        setPassword("");
      } else if (authMode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setMessage("Sessão iniciada com sucesso.");
        setPassword("");
      } else if (authMode === "reset") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (authError) throw authError;
        setMessage("Se existir uma conta associada a esse e-mail, receberás instruções para redefinir a palavra-passe.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Palavra-passe actualizada com sucesso. Já podes iniciar sessão com a nova palavra-passe.");
        setAuthMode("login");
        setPassword("");
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signOut();
    if (authError) setError(authError.message);
    else {
      setMessage("Sessão terminada.");
      setAuthOpen(false);
    }
  };

  return (
    <div className={dark ? "app-shell dark" : "app-shell light"}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="MentorX início">MentorX</a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a>
          <a href="#disciplinas" onClick={() => setMenuOpen(false)}>Disciplinas</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
        </nav>
        <div className="top-actions">
          <button className="icon-button theme-toggle" onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          {session ? <button className="login-link account-link" onClick={() => setAuthOpen(true)}>{session.user.email}</button> : <button className="login-link" onClick={() => openAuth("login")}>Entrar</button>}
          {session ? <button className="button button-small" onClick={handleLogout}>Sair</button> : <button className="button button-small" onClick={() => openAuth("register")}>Começar <ArrowRight size={16} /></button>}
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>
      <main>
        <section className="hero" id="sobre">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> O teu próximo nível começa aqui</div>
            <h1>Aprender melhor.<br /><span>Chegar mais longe.</span></h1>
            <p className="hero-description">Um espaço para estudar com orientação, encontrar materiais de qualidade e crescer com uma comunidade que partilha o mesmo objectivo.</p>
            <div className="hero-actions" id="comecar">
              <button className="button" onClick={() => openAuth("register")}>Criar conta gratuita <ArrowRight size={17} /></button>
              <a className="secondary-link" href="#disciplinas">Conhecer disciplinas</a>
            </div>
            <div className="hero-proof"><div className="proof-icon"><GraduationCap size={19} /></div><p><strong>Conhecimento que te acompanha.</strong><br /><span>Estuda, pratica e evolui todos os dias.</span></p></div>
          </div>
          <div className="hero-visual" aria-label="Pré-visualização conceptual da plataforma">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="floating-card card-main"><div className="card-topline"><span className="live-dot" /> PAINEL DE APRENDIZAGEM</div><div className="study-symbol"><BookOpen size={30} /></div><h3>O conhecimento abre caminhos.</h3><p>O teu espaço académico, num só lugar.</p><div className="progress-track"><span /></div><div className="progress-caption"><span>Ritmo de aprendizagem</span><strong>Em evolução</strong></div></div>
            <div className="floating-card mini-card mini-ai"><Bot size={19} /><span>MentorX AI</span><Sparkles size={15} /></div>
            <div className="floating-card mini-card mini-community"><MessageCircle size={18} /><span>Comunidade activa</span></div><div className="visual-glow" />
          </div>
        </section>
        <section className="feature-section section-wrap" id="recursos">
          <div className="section-heading"><span className="section-kicker">UM ECOSSISTEMA DE APRENDIZAGEM</span><h2>Mais do que estudar.<br /><span>É evoluir com estrutura.</span></h2><p>Ferramentas pensadas para transformar esforço em conhecimento.</p></div>
          <div className="feature-grid">{features.map(({ icon: Icon, title, description, label }) => <article className="feature-card" key={title}><div className="feature-icon"><Icon size={22} /></div><span className="feature-label">{label}</span><h3>{title}</h3><p>{description}</p><span className="feature-arrow"><ArrowRight size={18} /></span></article>)}</div>
        </section>
        <section className="subjects-section section-wrap" id="disciplinas">
          <div className="subjects-heading"><div><span className="section-kicker">CONHECIMENTO SEM FRONTEIRAS</span><h2>Explora as tuas disciplinas</h2></div><div className="search-pill"><Search size={16} /><span>Encontra a tua área</span></div></div>
          <div className="subject-list">{subjects.map((subject, index) => <span className="subject-chip" key={subject}>{String(index + 1).padStart(2, "0")} <b>{subject}</b><ArrowRight size={15} /></span>)}</div>
        </section>
        <section className="closing-cta section-wrap"><div><span className="section-kicker">O TEU FUTURO COMEÇA COM UMA DECISÃO</span><h2>O próximo passo é teu.</h2><p>Constrói conhecimento. Desenvolve competências. Vai mais longe.</p></div><button className="button" onClick={() => openAuth("register")}>Começar agora <ArrowRight size={17} /></button></section>
      </main>
      <footer className="footer"><a className="brand" href="#" aria-label="MentorX início">MentorX</a><span>© {new Date().getFullYear()} MentorX. Conhecimento que transforma.</span><span>Feito para aprender e evoluir.</span></footer>

      {authOpen && <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
        <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-close icon-button" onClick={() => setAuthOpen(false)} aria-label="Fechar"><X size={20} /></button>
          <div className="auth-brand">MentorX</div>
          <span className="section-kicker">{authMode === "register" ? "JUNTA-TE À COMUNIDADE" : authMode === "reset" || authMode === "update" ? "RECUPERA O ACESSO" : "BEM-VINDO DE VOLTA"}</span>
          <h2 id="auth-title">{authMode === "register" ? "Cria a tua conta" : authMode === "reset" ? "Redefinir palavra-passe" : authMode === "update" ? "Criar nova palavra-passe" : "Entrar na MentorX"}</h2>
          <p className="auth-subtitle">{authMode === "register" ? "Começa gratuitamente a tua jornada de aprendizagem." : authMode === "reset" ? "Indica o teu e-mail para receberes as instruções." : authMode === "update" ? "Define uma nova palavra-passe para a tua conta." : "Acede ao teu espaço de aprendizagem."}</p>
          {!isSupabaseConfigured && <div className="auth-notice">A ligação ao serviço de autenticação ainda não foi detectada nesta versão.</div>}
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "register" && <label><span>Nome completo</span><div className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="O teu nome" /></div></label>}
            <label><span>E-mail</span><div className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" /></div></label>
            {(authMode === "register" || authMode === "login" || authMode === "update") && <label><span>{authMode === "update" ? "Nova palavra-passe" : "Palavra-passe"}</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" /></div></label>}
            {error && <p className="auth-feedback error" role="alert">{error}</p>}
            {message && <p className="auth-feedback success" role="status">{message}</p>}
            <button className="button auth-submit" type="submit" disabled={busy}>{busy ? "A processar..." : authMode === "register" ? "Criar conta" : authMode === "reset" ? "Enviar instruções" : authMode === "update" ? "Guardar nova palavra-passe" : "Entrar"} <ArrowRight size={17} /></button>
          </form>
          <div className="auth-switches">
            {authMode === "login" && <><button onClick={() => openAuth("reset")}>Esqueci-me da palavra-passe</button><p>Ainda não tens conta? <button onClick={() => openAuth("register")}>Criar conta</button></p></>}
            {authMode === "register" && <p>Já tens conta? <button onClick={() => openAuth("login")}>Iniciar sessão</button></p>}
            {authMode === "reset" && <p>Lembraste da palavra-passe? <button onClick={() => openAuth("login")}>Voltar ao login</button></p>}
            {authMode === "update" && <p>Define a nova palavra-passe para continuares.</p>}
          </div>
          {session && <button className="auth-logout" onClick={handleLogout}>Terminar sessão ({session.user.email})</button>}
          <p className="auth-footnote">Ao criares uma conta, serás registado como estudante. Outros papéis são atribuídos pela administração.</p>
        </section>
      </div>}
    </div>
  );
}
