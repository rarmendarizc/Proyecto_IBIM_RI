import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Recuperar el estado inicial de sessionStorage o valores pasados desde navigate
  const initialQuery = location.state?.query || sessionStorage.getItem("searchQuery") || "";
  const initialMethod = location.state?.method || sessionStorage.getItem("searchMethod") || "tfidf";
  const initialResults =
    location.state?.results || JSON.parse(sessionStorage.getItem("searchResults") || "[]");
  const initialMetrics =
    location.state?.metrics || JSON.parse(sessionStorage.getItem("searchMetrics") || "{}");
  const initialCategory = sessionStorage.getItem("selectedCategory") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchMethod, setSearchMethod] = useState(initialMethod);
  const [results, setResults] = useState(Array.isArray(initialResults) ? initialResults : []);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);  // Almacena las categorías disponibles

  const resultsPerPage = 5;

  // Guardar estado de búsqueda en sessionStorage
  const saveSearchState = (query, method, results, metrics, selectedCategory) => {
    sessionStorage.setItem("searchQuery", query);
    sessionStorage.setItem("searchMethod", method);
    sessionStorage.setItem("searchResults", JSON.stringify(results));
    sessionStorage.setItem("searchMetrics", JSON.stringify(metrics));
    sessionStorage.setItem("selectedCategory", selectedCategory);
  };

  useEffect(() => {
    // Si hay estado pasado desde navigate, úsalo; de lo contrario, carga desde sessionStorage
    if (location.state) {
      setSearchQuery(location.state.query || "");
      setSearchMethod(location.state.method || "tfidf");
      setResults(location.state.results || []);
      setMetrics(location.state.metrics || {});
      setSelectedCategory(location.state.selectedCategory || "");
    } else {
      setSearchQuery(sessionStorage.getItem("searchQuery") || "");
      setSearchMethod(sessionStorage.getItem("searchMethod") || "tfidf");
      setResults(
        Array.isArray(JSON.parse(sessionStorage.getItem("searchResults")))
          ? JSON.parse(sessionStorage.getItem("searchResults"))
          : []
      );
      setMetrics(JSON.parse(sessionStorage.getItem("searchMetrics") || "{}"));
      setSelectedCategory(sessionStorage.getItem("selectedCategory") || "");
    }
  }, [location.state]);

  useEffect(() => {
    saveSearchState(searchQuery, searchMethod, results, metrics, selectedCategory);
  }, [searchQuery, searchMethod, results, metrics, selectedCategory]);

  useEffect(() => {
    // Obtener categorías involucradas
    const allCategories = results.flatMap(result => result.cats.split(","));
    setCategories([...new Set(allCategories)]); // Eliminar duplicados
    console.log("Categorías disponibles: ", categories);
  }, [results]);

  // Función para truncar texto
  const truncateText = (text, wordLimit) => {
    const words = text.split(" ");
    return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
  };

  // Lógica para aplicar el filtro de categorías
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (category) {
      // Si se selecciona una categoría específica
      const filteredResults = results.filter(result =>
        result.cats.includes(category)
      );
      setResults(filteredResults);
    } else {
      // Si no hay filtro, resetear resultados a los originales
      setResults(initialResults);
    }
    console.log("Resultados después de filtro de categoría: ", results);
  };


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
      setResults(data.resultados || []);
      setMetrics(data.metricas || {});
      setCurrentPage(1);

      // Guardar búsqueda en sessionStorage
      saveSearchState(searchQuery, searchMethod, data.resultados || [], data.metricas || {}, selectedCategory);
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
        query: searchQuery,
        results: results,
        metrics: metrics,
        selectedCategory: selectedCategory,
      },
    });
  };

  // Calcular paginación
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Fixed Header */}
        <nav className="navbar navbar-light bg-white border-bottom shadow-sm fixed-top" style={{ zIndex: 1030 }}>
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
              <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {/* Métodos de Búsqueda */}
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
                BoW
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

            {/* Filtros Button */}
            <div className="btn-outline-secondary">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
              >
                <option value="" disabled>
                  Filtros
                </option>

                <option value=""></option>

                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </nav>

        {/* Resultados de Búsqueda */}
        <div className="col-md-8 results-container mt-5">
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

        {/* Box de Métricas */}
        <div className="col-md-4 mt-5">
          <div
            className="card shadow-sm"
            style={{
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              position: "sticky",
              top: "80px",
            }}
          >
            <h5 className="text-center fw-bold">Métricas de la Consulta</h5>
            <hr />
            <ul className="list-unstyled">
              <li>
                <strong>Precisión:</strong> {metrics.precision || "N/A"}
              </li>
              <li>
                <strong>Recall:</strong> {metrics.recall || "N/A"}
              </li>
              <li>
                <strong>F1-Score:</strong> {metrics.f1_score || "N/A"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="row mt-4">
        <div className="col-md-12">
          <nav aria-label="Page navigation">
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
      </div>
    </div>
  );
}

export default SearchResults;
