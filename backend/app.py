from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec
import numpy as np
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite solicitudes desde cualquier origen

# Construir la ruta absoluta al archivo CSV
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "database_preprocessed.csv")

# Cargar el archivo
corpus = pd.read_csv(csv_path)

# Configuración de Bag of Words (BoW)
bow_vectorizer = CountVectorizer()
bow_matrix = bow_vectorizer.fit_transform(corpus["texto"])

# Configuración de TF-IDF
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(corpus["texto"])

# Configuración de Word2Vec
corpus['tokens_list'] = corpus['tokens'].apply(eval)  # Convertir cadenas de listas a listas reales
word2vec_model = Word2Vec(sentences=corpus['tokens_list'], vector_size=100, window=5, min_count=1, workers=4)

def get_average_word2vec(tokens, model, vector_size):
    """Calcula el promedio de vectores Word2Vec para un documento."""
    vector = np.zeros(vector_size)
    count = 0
    for word in tokens:
        if word in model.wv:
            vector += model.wv[word]
            count += 1
    return vector / count if count > 0 else vector

# Precomputar las representaciones vectoriales promedio para Word2Vec
word2vec_matrix = np.array([
    get_average_word2vec(tokens, word2vec_model, 100) for tokens in corpus['tokens_list']
])

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json  # Recibir datos desde el frontend
    consulta = data.get("query", "")
    metodo = data.get("method", "tfidf")  # Método predeterminado: TF-IDF

    try:
        if metodo == "bow":
            # Búsqueda por Bag of Words
            consulta_vector = bow_vectorizer.transform([consulta])
            similitudes = cosine_similarity(consulta_vector, bow_matrix).flatten()
        elif metodo == "tfidf":
            # Búsqueda por TF-IDF
            consulta_vector = tfidf_vectorizer.transform([consulta])
            similitudes = cosine_similarity(consulta_vector, tfidf_matrix).flatten()
        elif metodo == "word2vec":
            # Búsqueda por Word2Vec
            consulta_tokens = consulta.split()
            consulta_vector = get_average_word2vec(consulta_tokens, word2vec_model, 100)
            similitudes = cosine_similarity([consulta_vector], word2vec_matrix).flatten()
        else:
            return jsonify({"error": "Método de búsqueda no válido"}), 400

        # Obtener los 5 documentos más relevantes
        top_indices = similitudes.argsort()[-5:][::-1]
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
