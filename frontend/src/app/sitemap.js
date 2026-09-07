const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";
const SITE_URL = "https://siaa.seduc.pi.gov.br";

export default async function sitemap() {
  const rotasEstaticas = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  let rotasPosts = [];

  try {
    const res = await fetch(`${API_BASE}/api/blog/posts`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      rotasPosts = (data.posts || []).map((post) => ({
        url: `${SITE_URL}/blog/${post.id}`,
        lastModified: new Date(post.data_criacao),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap dos posts:", error);
  }

  return [...rotasEstaticas, ...rotasPosts];
}