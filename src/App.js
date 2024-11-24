import React, { useState } from "react";
import './App.css';

function App() {
    const [query, setQuery] = useState("");
    const [method, setMethod] = useState("tfidf"); // Método predeterminado
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, method }), // Enviar query y método
            });

            if (!response.ok) {
                throw new Error("Error en el servidor");
            }

            const data = await response.json();
            setResults(data);
            setError(""); // Limpia cualquier error previo
        } catch (err) {
            console.error(err);
            setError("No se pudo realizar la búsqueda. Intenta nuevamente.");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Buscador de Documentos</h1>

            {/* Input para la búsqueda */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe tu búsqueda"
                style={{ width: "300px", marginRight: "10px" }}
            />

            {/* Selección del método */}
            <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ marginRight: "10px" }}
            >
                <option value="tfidf">TF-IDF</option>
                <option value="bow">Bag of Words</option>
                <option value="word2vec">Word2Vec</option>
            </select>

            {/* Botón de búsqueda */}
            <button onClick={handleSearch}>Buscar</button>

            {/* Mostrar error */}
            {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

            {/* Resultados */}
            <div style={{ marginTop: "20px" }}>
                <h2>Resultados:</h2>
                {results.map((result, index) => (
                    <div
                        key={index}
                        style={{
                            marginBottom: "10px",
                            border: "1px solid #ccc",
                            padding: "10px",
                        }}
                    >
                        <h3>{result.nombre_archivo}</h3>
                        <p>Similitud: {result.similitud.toFixed(2)}</p>
                        <p>{result.texto}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
