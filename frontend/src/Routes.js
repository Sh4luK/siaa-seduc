import { Router, Route, BrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";

function AppRoutes() {
    return(
        <div>
            <BrowserRouter>
                <Router>
                    <Route path="/" exact component={Home} />
                    <Route path="/login" exact component={Login} />
                </Router>
            </BrowserRouter>
        </div>
    );
}

export default AppRoutes;