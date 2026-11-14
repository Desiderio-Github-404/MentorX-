import { useEffect, useState } from "react";
import { FileUp, FileText, Download, RefreshCw } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Course = { id: string; title: string };
type Module = { id: string; title: string };
type Lesson = { id: string; title: string };
type Material = { id: string; file_name: string; file_path: string; mime_type: string; file_size: number; created_at: string };

const acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp";

export default function MaterialsManager({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    client.from("courses").select("id,title").order("title").then(({ data, error }) => {
      if (!active) return;
      if (error) setFeedback(error.message);
      else setCourses(data || []);
    });
    return () => { active = false; };
  }, [client]);

  useEffect(() => {
    setModuleId(""); setLessonId(""); setModules([]); setLessons([]); setMaterials([]);
    if (!courseId) return;
    client.from("course_modules").select("id,title").eq("course_id", courseId).order("sort_order").then(({ data, error }) => {
      if (error) setFeedback(error.message);
      else setModules(data || []);
    });
  }, [client, courseId]);

  useEffect(() => {
    setLessonId(""); setLessons([]); setMaterials([]);
    if (!moduleId) return;
    client.from("lessons").select("id,title").eq("module_id", moduleId).order("sort_order").then(({ data, error }) => {
      if (error) setFeedback(error.message);
      else setLessons(data || []);
    });
  }, [client, moduleId]);

  const loadMaterials = async () => {
    if (!lessonId) { setMaterials([]); return; }
    const { data, error } = await client.from("lesson_materials")
      .select("id,file_name,file_path,mime_type,file_size,created_at")
      .eq("lesson_id", lessonId).order("created_at", { ascending: false });
    if (error) setFeedback(error.message);
    else setMaterials((data || []) as Material[]);
  };

  useEffect(() => { void loadMaterials(); }, [lessonId]);

  const uploadMaterial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !lessonId) return;
    if (file.size > 50 * 1024 * 1024) {
      setFeedback("O ficheiro ultrapassa o limite de 50 MB."); return;
    }
    setBusy(true); setFeedback("");
    const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${lessonId}/${Date.now()}-${safeName}`;
    try {
      const { error: uploadError } = await client.storage.from("lesson-materials").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream"
      });
      if (uploadError) throw uploadError;
      const { error: metadataError } = await client.from("lesson_materials").insert({
        lesson_id: lessonId, uploaded_by: userId, file_name: file.name,
        file_path: path, mime_type: file.type || "application/octet-stream", file_size: file.size
      });
      if (metadataError) {
        await client.storage.from("lesson-materials").remove([path]);
        throw metadataError;
      }
      setFile(null);
      const input = document.getElementById("mentorx-material-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setFeedback("Material enviado e associado à aula com sucesso.");
      await loadMaterials();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível enviar o ficheiro.");
    } finally { setBusy(false); }
  };

  const downloadMaterial = async (path: string) => {
    const { data, error } = await client.storage.from("lesson-materials").createSignedUrl(path, 60);
    if (error) setFeedback(error.message);
    else if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return <div className="materials-manager">
    <div className="dashboard-welcome"><div><span className="section-kicker">GESTÃO ACADÉMICA</span><h1>Materiais das aulas</h1><p>Carrega e organiza documentos no armazenamento privado da MentorX.</p></div><div className="dashboard-avatar"><FileUp size={23} /></div></div>
    <div className="dashboard-panel materials-panel">
      <span className="section-kicker">1 · ESCOLHER A AULA</span>
      <div className="materials-select-grid">
        <label>Curso<select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">Seleccionar curso</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label>Módulo<select value={moduleId} onChange={e => setModuleId(e.target.value)} disabled={!courseId}><option value="">Seleccionar módulo</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
        <label>Aula<select value={lessonId} onChange={e => setLessonId(e.target.value)} disabled={!moduleId}><option value="">Seleccionar aula</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
      </div>
    </div>
    <div className="dashboard-panel materials-panel">
      <span className="section-kicker">2 · CARREGAR MATERIAL</span>
      <form className="materials-upload-form" onSubmit={uploadMaterial}>
        <label>Ficheiro (PDF, Word, Excel, PowerPoint ou imagem)<input id="mentorx-material-file" type="file" accept={acceptedTypes} disabled={!lessonId || busy} onChange={e => setFile(e.target.files?.[0] || null)} /></label>
        <small>Limite máximo: 50 MB por ficheiro. O material ficará privado.</small>
        <button className="button" type="submit" disabled={!lessonId || !file || busy}><FileUp size={16}/>{busy ? "A enviar..." : "Enviar material"}</button>
      </form>
    </div>
    <div className="dashboard-panel materials-panel">
      <div className="materials-list-heading"><div><span className="section-kicker">3 · FICHEIROS DA AULA</span><h2>Materiais disponíveis</h2></div><button className="profile-edit-button" onClick={() => void loadMaterials()} disabled={!lessonId}><RefreshCw size={14}/> Actualizar</button></div>
      {!lessonId ? <div className="subjects-empty">Selecciona um curso, módulo e aula para consultar os materiais.</div> : materials.length === 0 ? <div className="subjects-empty">Ainda não existem materiais associados a esta aula.</div> : materials.map(item => <div className="material-row" key={item.id}><FileText size={19}/><div><strong>{item.file_name}</strong><small>{(item.file_size / 1024 / 1024).toFixed(2)} MB · {new Date(item.created_at).toLocaleDateString("pt-PT")}</small></div><button className="profile-edit-button" onClick={() => void downloadMaterial(item.file_path)}><Download size={15}/> Abrir</button></div>)}
    </div>
    {feedback && <p className="subjects-feedback" role="status">{feedback}</p>}
  </div>;
}
