from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite solicitudes desde cualquier origen

# Construir la ruta absoluta al archivo CSV
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "database_preprocessed.csv")

# Cargar el archivo y configurar TF-IDF
corpus = pd.read_csv(csv_path)
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(corpus["texto"])

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json  # Recibir datos desde el frontend
    consulta = data.get("query", "")
    
    try:
        # Calcular la similitud coseno con el TF-IDF
        consulta_vector = tfidf_vectorizer.transform([consulta])
        similitudes = cosine_similarity(consulta_vector, tfidf_matrix).flatten()
        top_indices = similitudes.argsort()[-5:][::-1]  # Los 5 documentos más relevantes

        resultados = [
            {
                "nombre_archivo": str(corpus.loc[idx, "nombre del archivo"]),  # Convertir a string
                "similitud": float(similitudes[idx]),  # Convertir a float
                "texto": str(corpus.loc[idx, "texto"][:200]) + "..."  # Convertir a string
            }
            for idx in top_indices
        ]

        return jsonify(resultados)

    except Exception as e:
        print("Error:", e)  # Imprimir el error para depuración
        return jsonify({"error": "Error interno del servidor"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
