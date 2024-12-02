import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    title,
    text,
    similitud,
    metodo,
    cats,
    query,
    results,
    metrics,
  } = location.state || {};  // Asegurarse de que se pasa correctamente el estado

  // Asegurarse de que la página se desplace al principio al renderizar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Manejar el clic en el botón de "Volver" para regresar a SearchResults con los datos actuales
  const handleBack = () => {
    navigate("/results", {
      state: {
        query,   // Pasamos la consulta de búsqueda
        method: metodo,  // Pasamos el método de búsqueda utilizado
        results,  // Los resultados obtenidos
        metrics,  // Las métricas obtenidas
      },
    });
  };

  return (
    <div>
      {/* Fixed Header */}
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm fixed-top" style={{ zIndex: 1030 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Back Button */}
          <button
            className="btn btn-outline-secondary"
            onClick={handleBack}  // Llamamos a handleBack al hacer clic en el botón
            style={{ fontWeight: "bold" }}
          >
            ← Volver
          </button>

          {/* Logo */}
          <img
            src="/images/alphaquery.png"
            alt="AlphaQuery Logo"
            style={{
              height: "50px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          />

          {/* Placeholder for alignment */}
          <div style={{ width: "90px" }}></div>
        </div>
      </nav>

      {/* Detail Content */}
      <div className="container" style={{ marginTop: "80px" }}>
        <div className="row">
          {/* Title and Text on the Left */}
          <div className="col-md-8">
            <h1 className="text-primary fw-bold">{title}</h1>
            <p className="text-muted">
              <strong>Categoría:</strong> {cats ? cats : "Sin categoría"}
            </p>
            <hr />
            <p className="fs-5 text-justify" style={{ lineHeight: "1.6" }}>
              {text}
            </p>
          </div>

          {/* Metrics Box on the Right */}
          <div className="col-md-4">
            <div className="card shadow-sm" style={{ padding: "20px", borderRadius: "10px", border: "1px solid #ddd", position: "sticky", top: "80px" }}>
              <h5 className="text-center fw-bold">Detalle de métricas</h5>
              <hr />
              <ul className="list-unstyled">
                <li>
                  <strong>Método:</strong> {metodo}
                </li>
                <li>
                  <strong>Similitud:</strong> {similitud}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultDetail;
