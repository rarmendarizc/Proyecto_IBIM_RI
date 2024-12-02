import React, { useState } from "react"; // Importa React y useState para manejar el estado local.
import { useNavigate } from "react-router-dom"; // Importa useNavigate para redirigir entre rutas.
import "bootstrap/dist/css/bootstrap.min.css"; // Estilos de Bootstrap.
import "./App.css"; // Estilos personalizados.

function Home() {
    // Estado para la consulta de búsqueda.
    const [query, setQuery] = useState("");

    // Estado para el método de búsqueda seleccionado (predeterminado: "tfidf").
    const [method, setMethod] = useState("tfidf");

    // Estado para mostrar si la aplicación está cargando.
    const [isLoading, setIsLoading] = useState(false);

    // Hook para la navegación a otras rutas.
    const navigate = useNavigate();

    // Función que maneja la lógica de búsqueda.
    const handleSearch = async () => {
        // Verifica que haya un término de búsqueda.
        if (!query.trim()) {
            alert("Por favor, ingresa un término de búsqueda.");
            return;
        }

        setIsLoading(true); // Activa el estado de carga.

        try {
            // Realiza una solicitud POST a la API con el término de búsqueda y el método.
            const response = await fetch("http://127.0.0.1:5000/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Indica que se envía JSON.
                },
                body: JSON.stringify({ query, method }), // Envía la consulta y el método seleccionado.
            });

            // Verifica si la respuesta del servidor es exitosa.
            if (!response.ok) {
                const errorText = await response.text(); // Obtiene el mensaje de error.
                throw new Error(`Error en el servidor: ${errorText}`);
            }

            // Procesa la respuesta del servidor.
            const data = await response.json();

            // Redirige a la página de resultados, pasando los datos necesarios.
            navigate("/results", {
                state: {
                    query, // Consulta realizada.
                    method, // Método de búsqueda seleccionado.
                    results: data.resultados || [], // Resultados de la búsqueda.
                    metrics: data.metricas || {}, // Métricas de rendimiento.
                    categories: data.categories || [], // Categorías de resultados.
                },
            });
        } catch (err) {
            // Maneja errores de la solicitud.
            console.error("Error al realizar la búsqueda:", err);
            alert("No se pudo realizar la búsqueda. Intenta nuevamente.");
        } finally {
            setIsLoading(false); // Desactiva el estado de carga.
        }
    };

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
            {/* Logo de la aplicación */}
            <img
                src="/images/alphaquery.png" // Ruta del logo.
                alt="AlphaQuery Logo" // Texto alternativo para accesibilidad.
                className="mb-4"
                style={{ maxWidth: "500px", height: "auto" }} // Estilo responsivo.
            />

            {/* Campo de entrada y botón de búsqueda */}
            <div className="input-group mb-4 w-75">
                <input
                    type="text" // Campo de texto para la búsqueda.
                    value={query} // Valor ligado al estado `query`.
                    onChange={(e) => setQuery(e.target.value)} // Actualiza el estado al escribir.
                    placeholder="Escribe tu búsqueda" // Texto de ayuda.
                    className="form-control"
                />
                <button onClick={handleSearch} className="btn btn-primary">
                    Buscar
                </button>
            </div>

            {/* Botones de selección de método */}
            <div className="btn-group" role="group" aria-label="Selecciona método">
                <input
                    type="radio" // Botón de radio para "Bag of Words".
                    className="btn-check"
                    name="method" // Todos los botones comparten el mismo grupo.
                    id="method-bow"
                    value="bow"
                    checked={method === "bow"} // Marca si `method` coincide.
                    onChange={() => setMethod("bow")} // Actualiza el método seleccionado.
                />
                <label className="btn btn-outline-primary" htmlFor="method-bow">
                    Bag of Words (BoW)
                </label>

                <input
                    type="radio" // Botón de radio para "TF-IDF".
                    className="btn-check"
                    name="method"
                    id="method-tfidf"
                    value="tfidf"
                    checked={method === "tfidf"}
                    onChange={() => setMethod("tfidf")}
                />
                <label className="btn btn-outline-primary" htmlFor="method-tfidf">
                    TF-IDF
                </label>

                <input
                    type="radio" // Botón de radio para "Word2Vec".
                    className="btn-check"
                    name="method"
                    id="method-word2vec"
                    value="word2vec"
                    checked={method === "word2vec"}
                    onChange={() => setMethod("word2vec")}
                />
                <label className="btn btn-outline-primary" htmlFor="method-word2vec">
                    Word2Vec
                </label>
            </div>
        </div>
    );
}

export default Home; // Exporta el componente para usarlo en otros archivos.
