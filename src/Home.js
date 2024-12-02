import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";


function Home() {
    const [query, setQuery] = useState("");
    const [method, setMethod] = useState("tfidf"); // Método predeterminado
    const navigate = useNavigate();

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

            // Redirigir al usuario a la página de resultados con los datos de búsqueda
            navigate("/results", { state: { query, method, results: data } });
        } catch (err) {
            console.error(err);
            alert("No se pudo realizar la búsqueda. Intenta nuevamente.");
        }
    };

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
            <img
                src="/images/alphaquery.png"
                alt="AlphaQuery Logo"
                className="mb-4"
                style={{ maxWidth: "500px", height: "auto" }}
            />
    
            <div className="input-group mb-4 w-75">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Escribe tu búsqueda"
                    className="form-control"
                />
                <button onClick={handleSearch} className="btn btn-primary">
                    Buscar
                </button>
            </div>
    
            <div className="btn-group" role="group" aria-label="Selecciona método">
                <input
                    type="radio"
                    className="btn-check"
                    name="method"
                    id="method-bow"
                    value="bow"
                    checked={method === "bow"}
                    onChange={() => setMethod("bow")}
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
                    checked={method === "tfidf"}
                    onChange={() => setMethod("tfidf")}
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

export default Home;
