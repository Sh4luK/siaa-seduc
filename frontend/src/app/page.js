import axios from "axios";
import { redirect } from "next/navigation"

// async function fetchProtectedData() {
//   try {
//     const loginResponse = await axios.post("https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/login/", {
//       username: "joseiraildes",
//       password: "cipriano.500"
//     });
//     console.log(loginResponse.data);
//   } catch (error) {
//     console.error("Error fetching protected data:", error);
//   } 
// }
export default async function Home() {
  // fetchProtectedData();
  const base_url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev"
  const login_url = `${base_url}/api/login/`;
  const auth_url = `${base_url}/api/auth/`;

  // using fetch
  const res = axios.get(auth_url)
  if (res.status === 200) {
    console.log("User is authenticated");
    redirect("/dashboard");
  } else {
    console.log("User is not authenticated, redirecting to login...");
    redirect("/login");
  }
  return (
    <div>
      <h1>Welcome to the SIAA Frontend</h1>
      <p>Checking authentication...</p>
    </div>
  );


}
