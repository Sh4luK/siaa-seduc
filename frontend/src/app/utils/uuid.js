export function gerarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback simples para contextos não-seguros (HTTP em IP não-localhost).
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}