async function createJson(){
  const data = {
    "username": "admin",
    "password": "admin123"
  }
  const url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/login/"

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  const result = await response.json();
  console.log(result);
}

export default function Home() {
  createJson();
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
