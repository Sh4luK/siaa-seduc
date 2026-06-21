import logo from "../../../assets/logo.png"

export default function AdmLoginPage(){
    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
            <div className="card shadow" style={{ borderRadius: "10px", padding: "10px" }}>
                <div className="card-body">
                    <img src={logo.src} alt="Logo" style={{ width: "200px", height: "auto" }} />
                    <h2 className="text-center card-title">
                        Login
                    </h2>
                    <form className="form" method="POST">
                        <div className="mb-2">
                            <label className="form-label">
                                Cpf <strong className="text-danger">
                                    *
                                </strong>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Senha <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                            />
                        </div>
                        <div className="mb-2 d-grid gap-2">
                            <button
                                type="submit"
                                className="btn btn-success btn-md"
                            >Entrar</button>
                        </div>
                    </form>
                </div>
            </div>
            
        </div>
    )
}