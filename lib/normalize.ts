// Forma canónica para comparar nombres de puesto: minúsculas, sin acentos, sin
// puntuación y con los espacios colapsados. NO se persiste; solo sirve para
// comparar ("Backend Engineer " === "backend engineer"). Módulo puro y sin
// dependencias para poder reutilizarlo también en cliente (upload-form) sin
// arrastrar el SDK de IA al bundle.
export function normalizePositionName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos
    .replace(/[^a-z0-9 ]+/g, " ") // signos -> espacio
    .replace(/\s+/g, " ")
    .trim();
}
