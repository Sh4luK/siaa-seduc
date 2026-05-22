import './App.css'

function App() {
  return (
    <div className="container">
      <h1 className="text-center mt-4">
        SIAA - Sistema de Informações de Atividades Acadêmicas
      </h1>

      <div className="row">
        <div
          className="col-md-4 offset-md-4 shadow p-3 mb-5 bg-body rounded"
          style={{ marginTop: '100px' }}
        >
          <form action="/login" method="post">
            <div className="text-center">
              <h2>Login</h2>
            </div>

            <hr />

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                aria-describedby="emailHelp"
              />
              <div id="emailHelp" className="form-text">
                We'll never share your email with anyone else.
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App