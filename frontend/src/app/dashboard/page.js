import axios from "axios"

export default async function  Dashboard() {
    // fetch user data informations
    const user = await fetch("https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/auth/")
    const data = await user.json();
    console.log(data)
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to the dashboard! You are successfully authenticated.</p>
        </div>
    );
}