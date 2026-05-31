import axios from "axios";

async function fetchProtectedData() {
  try {
    const loginResponse = await axios.post("https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/login/", {
      username: "joseiraildes",
      password: "cipriano.500"
    });
    console.log(loginResponse.data);
  } catch (error) {
    console.error("Error fetching protected data:", error);
  } 
}
export default function Home() {
  fetchProtectedData();
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
