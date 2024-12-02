import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Recuperar el estado inicial de sessionStorage o valores predeterminados
  const initialQuery =
    location.state?.query || sessionStorage.getItem("searchQuery") || "";
  const initialMethod =
    location.state?.method || sessionStorage.getItem("searchMethod") || "tfidf";
  const initialResults =
    location.state?.results || JSON.parse(sessionStorage.getItem("searchResults") || "[]");

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchMethod, setSearchMethod] = useState(initialMethod);
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5;

  // Actualizar `sessionStorage` con la última búsqueda
  const saveSearchState = (query, method, results) => {
    sessionStorage.setItem("searchQuery", query);
    sessionStorage.setItem("searchMethod", method);
    sessionStorage.setItem("searchResults", JSON.stringify(results));
  };

  useEffect(() => {
    saveSearchState(searchQuery, searchMethod, results);
  }, [searchQuery, searchMethod, results]);

  // Cargar la configuración inicial desde sessionStorage al montar el componente
  useEffect(() => {
    setSearchQuery(sessionStorage.getItem("searchQuery") || "");
    setSearchMethod(sessionStorage.getItem("searchMethod") || "tfidf");
    setResults(JSON.parse(sessionStorage.getItem("searchResults") || "[]"));
  }, []);

  // Función para truncar texto
  const truncateText = (text, wordLimit) => {
    const words = text.split(" ");
    return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Por favor, ingresa un término de búsqueda.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery, method: searchMethod }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el servidor: ${errorText}`);
      }

      const data = await response.json();
      setResults(data);
      setCurrentPage(1);

      // Guardar búsqueda en sessionStorage
      saveSearchState(searchQuery, searchMethod, data);
    } catch (err) {
      console.error("Error al realizar la búsqueda:", err);
      alert("Hubo un error al realizar la búsqueda. Por favor, intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar clic en un resultado
  const handleResultClick = (result) => {
    navigate("/result-detail", {
      state: {
        title: result.titulo,
        text: result.textodetallado,
        similitud: result.similitud,
        metodo: searchMethod,
        cats: result.cats,
      },
    });
  };

  // Calcular paginación
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);

  return (
    <div>
      {/* Fixed Header */}
      <nav
        className="navbar navbar-light bg-white border-bottom shadow-sm fixed-top"
        style={{ zIndex: 1030 }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
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

          {/* Search Bar */}
          <div className="d-flex align-items-center w-50">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe tu búsqueda"
              className="form-control me-2"
              style={{ height: "45px", fontSize: "16px" }}
            />
            <button
              className="btn btn-primary"
              style={{ height: "45px" }}
              onClick={handleSearch}
            >
              {isLoading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* Metric Selection */}
          <div className="btn-group" role="group">
            <input
              type="radio"
              className="btn-check"
              name="method"
              id="method-bow"
              value="bow"
              checked={searchMethod === "bow"}
              onChange={() => setSearchMethod("bow")}
            />
            <label className="btn btn-outline-primary" htmlFor="method-bow">
              Bag of Words (BoW)
            </label>

            <input
              type="radio"
              className="btn-check"
              name="method"
              id="method-tfidf"
              value="tfidf"
              checked={searchMethod === "tfidf"}
              onChange={() => setSearchMethod("tfidf")}
            />
            <label className="btn btn-outline-primary" htmlFor="method-tfidf">
              TF-IDF
            </label>

            <input
              type="radio"
              className="btn-check"
              name="method"
              id="method-word2vec"
              value="word2vec"
              checked={searchMethod === "word2vec"}
              onChange={() => setSearchMethod("word2vec")}
            />
            <label className="btn btn-outline-primary" htmlFor="method-word2vec">
              Word2Vec
            </label>
          </div>
        </div>
      </nav>

      {/* Search Results */}
      <div className="results-container mt-5">
        {currentResults.length > 0 ? (
          currentResults.map((result, index) => (
            <div
              key={index}
              className="card mb-3"
              style={{
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
              onClick={() => handleResultClick(result)}
            >
              <h5 style={{ color: "#1c273f", fontWeight: "bold" }}>{result.titulo}</h5>
              <p>{truncateText(result.texto, 200)}</p>
            </div>
          ))
        ) : (
          <p>No se encontraron resultados.</p>
        )}
      </div>

      {/* Pagination */}
      <nav className="pagination-nav mt-3">
        <ul className="pagination justify-content-center">
          {Array.from({ length: totalPages }).map((_, index) => (
            <li
              key={index}
              className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default SearchResults;
