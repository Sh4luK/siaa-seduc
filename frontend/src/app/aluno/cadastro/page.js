import logo from "../../../assets/logo.png"

export default function AlunoCadastroPage() {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
            <div className="card shadow" style={{ borderRadius: "10px" }}>
                <div className="card-body">
                    <div className="text-center">
                        <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
                    </div>
                    <h2 className="card-title text-center">Cadastro do Aluno</h2>
                    <form className="form" method="POST">
                        <div className="mb-2">
                            <label className="form-label">
                                Nome completo <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Informe seu nome completo"
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Cpf <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                min="11"
                                placeholder="Informe os 11 digitos do CPF"
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Email <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Email institucional ou privado"
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Numero de telefone <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="tel"
                                className="form-control"
                                maxLength={16}
                                placeholder="Numero de telefone válido."
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Senha <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Informe uma senha de até 16 caracteres."
                            />
                        </div>
                        <div className="mb-2 d-grid gap-2">
                            <button className="btn btn-success btn-md">Entrar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}