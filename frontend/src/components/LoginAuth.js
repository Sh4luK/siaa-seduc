import axios from "axios";

export default async function LoginAuth(base_url, data){
    const login_url = `${base_url}/api/login/`;
    const auth_url = `${base_url}/api/auth/`;

    console.log({
         username: data.username,
         password: data.password
     })

    const login = await axios.post(login_url, data)

    console.log("Login response:", login.status);
    if(login.status === 200){
        console.log("Login successful, checking authentication...");
        // Check authentication status
        const auth = await axios.get(auth_url)
        if (auth.status === 200) {
            console.log("User is authenticated, redirecting to dashboard...");
            window.location.href = "/dashboard";
        } else {
            console.log("User is not authenticated after login, staying on login page...");
            return alert("Login successful but authentication failed. Please try again.");
            return redirect("/login");
        }
    } else {
        console.log("Login failed, staying on login page...");
        return alert("Login failed. Please check your credentials and try again.");
    }


}
