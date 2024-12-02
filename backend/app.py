from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec
import numpy as np
import os
import json
import zipfile
from flask_cors import CORS
from nltk.stem import PorterStemmer
import re

app = Flask(__name__)
CORS(app)

# Ruta al archivo ZIP
base_dir = os.path.dirname(os.path.abspath(__file__))
zip_path = os.path.join(base_dir, "database.zip")
csv_filename = "database.csv"
inverted_index_path = os.path.join(base_dir, "inverted_index.json")

# Leer el archivo CSV desde el ZIP
with zipfile.ZipFile(zip_path, 'r') as z:
    with z.open(csv_filename) as f:
        corpus = pd.read_csv(f)

# Cargar índice invertido
with open(inverted_index_path, "r") as f:
    inverted_index = json.load(f)

# Configuración de Bag of Words (BoW)
bow_vectorizer = CountVectorizer()
bow_matrix = bow_vectorizer.fit_transform(corpus["preproc_doc"])

# Configuración de TF-IDF
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(corpus["preproc_doc"])

# Configuración de Word2Vec
corpus['tokens_list'] = corpus['preproc_doc'].apply(eval)  # Convertir cadenas de listas a listas reales
word2vec_model = Word2Vec(sentences=corpus['tokens_list'], vector_size=100, window=5, min_count=1, workers=4)

# Función para calcular la representación vectorial promedio de Word2Vec
def get_average_word2vec(tokens, model, vector_size):
    vector = np.zeros(vector_size)
    count = 0
    for word in tokens:
        if word in model.wv:
            vector += model.wv[word]
            count += 1
    return vector / count if count > 0 else None  # Devuelve None si no hay palabras válidas

# Precomputar las representaciones vectoriales promedio para Word2Vec
word2vec_matrix = np.array([
    get_average_word2vec(tokens, word2vec_model, 100) for tokens in corpus['tokens_list']
])

# Configuración de stemming y stopwords
stemmer = PorterStemmer()
stopwords_path = os.path.join(base_dir, "stopwords")
with open(stopwords_path, "r", encoding="utf-8") as f:
    custom_stopwords = set(f.read().splitlines())

# Función para limpiar texto
def limpiar_texto(texto):
    texto = re.sub(r'[^\w\s]', '', texto)  # Eliminar caracteres especiales
    texto = texto.lower().strip()  # Convertir a minúsculas
    return texto

# Función para buscar documentos relevantes en el índice invertido
def buscar_en_indice_invertido(tokens):
    """Obtiene los documentos que contienen al menos uno de los tokens dados."""
    documentos = set()
    for token in tokens:
        if token in inverted_index:
            documentos.update(inverted_index[token])
    return list(documentos)

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    consulta = data.get("query", "")
    metodo = data.get("method", "tfidf")

    # Preprocesar la consulta
    consulta_limpia = limpiar_texto(consulta)
    consulta_tokens = consulta_limpia.split()
    consulta_tokens = [token for token in consulta_tokens if token not in custom_stopwords]
    consulta_tokens_stemmed = [stemmer.stem(token) for token in consulta_tokens]

    if not consulta_tokens_stemmed:
        return jsonify({"error": "Consulta inválida o sin palabras relevantes"}), 400

    try:
        # Buscar en el índice invertido para reducir el conjunto de documentos
        doc_indices = buscar_en_indice_invertido(consulta_tokens_stemmed)
        if not doc_indices:
            return jsonify([])  # No hay documentos relevantes

        # Filtrar las matrices y calcular similitudes
        if metodo == "bow":
            consulta_vector = bow_vectorizer.transform([" ".join(consulta_tokens_stemmed)])
            similitudes = cosine_similarity(consulta_vector, bow_matrix[doc_indices]).flatten()
        elif metodo == "tfidf":
            consulta_vector = tfidf_vectorizer.transform([" ".join(consulta_tokens_stemmed)])
            similitudes = cosine_similarity(consulta_vector, tfidf_matrix[doc_indices]).flatten()
        elif metodo == "word2vec":
            consulta_vector = get_average_word2vec(consulta_tokens_stemmed, word2vec_model, 100)
            if consulta_vector is None:  # Verificar si no hay palabras válidas
                return jsonify({"error": "Consulta inválida o sin palabras relevantes"}), 400
            similitudes = cosine_similarity([consulta_vector], word2vec_matrix[doc_indices]).flatten()
        else:
            return jsonify({"error": "Método de búsqueda no válido"}), 400

        # Mapear índices locales a índices globales y ordenar por similitud
        ranked_indices = sorted(
            zip(doc_indices, similitudes),
            key=lambda x: x[1],  # Ordenar por similitud (ranking)
            reverse=True  # De mayor a menor similitud
        )

        # Generar resultados
        resultados = [
            {
                "id": int(corpus.loc[idx, "id"]),
                "titulo": str(corpus.loc[idx, "title"]),
                "similitud": float(score),
                "texto": str(corpus.loc[idx, "text"][:200]) + "...",
                "textodetallado": str(corpus.loc[idx, "text"]),
                "cats": str(corpus.loc[idx, "cats"])
            }
            for idx, score in ranked_indices[:25]
        ]

        return jsonify(resultados)

    except Exception as e:
        print("Error en la búsqueda:", e)
        return jsonify({"error": "Error interno del servidor"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
