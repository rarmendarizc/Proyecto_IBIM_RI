from flask import Flask, request, jsonify 
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import precision_score, recall_score, f1_score
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

# Ruta al archivo ZIP con los datos
base_dir = os.path.dirname(os.path.abspath(__file__))  # Directorio donde está el script
zip_path = os.path.join(base_dir, "database.zip")
csv_filename = "database.csv"
inverted_index_path = os.path.join(base_dir, "inverted_index.json")

# Leer el archivo CSV desde el ZIP
with zipfile.ZipFile(zip_path, 'r') as z:
    with z.open(csv_filename) as f:
        corpus = pd.read_csv(f)

# Representación de Datos en Espacio Vectorial 
# Utilizar técnicas de vectorización de texto

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

# Indexación 
# Cargar índice invertido (estructura que mapea los términos a documentos)
with open(inverted_index_path, "r") as f:
    inverted_index = json.load(f)

# Construcción del índice invertido
def buscar_en_indice_invertido(tokens):
    """Obtiene los documentos que contienen al menos uno de los tokens dados."""
    documentos = set()
    for token in tokens:
        if token in inverted_index:
            documentos.update(inverted_index[token])
    return list(documentos)

# Diseño del Motor de Búsqueda 

# Configuración de stemming y stopwords
stemmer = PorterStemmer()
stopwords_path = os.path.join(base_dir, "stopwords")
with open(stopwords_path, "r", encoding="utf-8") as f:
    custom_stopwords = set(f.read().splitlines())

# Función para preprocesar la consulta (limpieza, tokenización, stopwords y stemming)
def procesar_consulta(consulta):
    texto = consulta.lower()  # Convertir a minúsculas

    # Eliminar patrones HTML, caracteres especiales y puntuación
    texto = re.sub(r'&lt;[^ ]*', '', texto)  # Eliminar el patrón desde &lt; hasta el primer espacio
    texto = re.sub(r'[<>]', '', texto)  # Remover caracteres sobrantes como < y >
    texto = re.sub(r'[.,;!?-]', '', texto)  # Remover caracteres específicos como , . ; ! ?
    texto = re.sub(r'[^\w\s]', '', texto)  # Remover cualquier otro carácter especial
    texto = re.sub(r'\s+', ' ', texto).strip()  # Reemplazar múltiples espacios por uno solo

    tokens = texto.split()  # Tokenización: dividir el texto en palabras
    tokens = [token for token in tokens if token not in custom_stopwords]  # Eliminar stopwords
    tokens_stemmed = [stemmer.stem(token) for token in tokens]  # Aplicar stemming
    return tokens_stemmed

# Evaluación del Sistema 

# Función para guardar los resultados de evaluación en un archivo CSV
def guardar_resultados_evaluacion(resultados_evaluacion):
    archivo_csv = os.path.join(base_dir, "evaluacion_sistema.csv")

    df_resultados = pd.DataFrame(resultados_evaluacion)
    
    # Guardar el DataFrame como archivo CSV
    df_resultados.to_csv(archivo_csv, index=False, mode='a', header=not os.path.exists(archivo_csv))  
    
    print(f"Resultados de evaluación guardados en '{archivo_csv}'.")

# Evaluación utilizando precisión, recall y F1-score
@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    consulta = data.get("query", "")
    metodo = data.get("method", "tfidf")
    categoria = data.get("categoria", None)  

    # Preprocesar la consulta
    consulta_tokens_stemmed = procesar_consulta(consulta)

    if not consulta_tokens_stemmed:
        return jsonify({"error": "Consulta inválida o sin palabras relevantes"}), 400

    try:
        # Buscar en el índice invertido para reducir el conjunto de documentos
        doc_indices = buscar_en_indice_invertido(consulta_tokens_stemmed)
        if not doc_indices:
            return jsonify({"resultados": [], "metricas": {"precision": 0, "recall": 0, "f1_score": 0}})  # No hay documentos relevantes

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
            key=lambda x: x[1],  # Ranking
            reverse=True  # De mayor a menor similitud
        )

        # Si se desea filtrar los resultados por la categoría
        if categoria:
            ranked_indices = [
                (idx, score) for idx, score in ranked_indices
                if categoria in corpus.loc[idx, "cats"].split(",")  
            ]

        # Generar un pseudo-ground truth dinámico con similitud > 0.2
        umbral_similitud = 0.2
        relevantes = [idx for idx, score in ranked_indices if score >= umbral_similitud]
        recuperados = [doc[0] for doc in ranked_indices[:25]]

        # Calcular métricas
        y_true = [1 if idx in relevantes else 0 for idx in range(len(corpus))]
        y_pred = [1 if idx in recuperados else 0 for idx in range(len(corpus))]

        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)

        # Generar resultados
        resultados = [
            {
                "id": int(corpus.loc[idx, "id"]),
                "titulo": str(corpus.loc[idx, "title"]),
                "similitud": float(score),
                "texto": str(corpus.loc[idx, "text"][:200]) + "...",
                "textodetallado": str(corpus.loc[idx, "text"]),
                "cats": str(corpus.loc[idx, "cats"]),
            }
            for idx, score in ranked_indices[:25]
        ]

        # Guardar los resultados de la evaluación 
        resultados_evaluacion = [{
            "consulta": consulta,
            "metodo": metodo, 
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "relevantes_encontrados": len(relevantes)
        }]
        
        # Llamar a la función para guardar los resultados en el archivo CSV
        guardar_resultados_evaluacion(resultados_evaluacion)

        return jsonify({"resultados": resultados, "metricas": {"precision": precision, "recall": recall, "f1_score": f1}})

    except Exception as e:
        print("Error en la búsqueda:", e)
        return jsonify({"error": "Error interno del servidor"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
