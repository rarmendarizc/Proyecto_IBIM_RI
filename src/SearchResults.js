import React from 'react';

function SearchResults({ query, onBack }) {
  // Datos simulados para los resultados
  const results = [
    { id: 1, title: 'Resultado 1', description: 'Descripción del resultado 1.' },
    { id: 2, title: 'Resultado 2', description: 'Descripción del resultado 2.' },
    { id: 3, title: 'Resultado 3', description: 'Descripción del resultado 3.' },
  ];

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      {/* Header con botón de inicio */}
      <header
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '8px',
        }}
      >
        <h1 style={{ margin: 0 }}>Resultados de búsqueda</h1>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Inicio
        </button>
      </header>

      {/* Resultados */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#333' }}>Resultados para: "{query}"</h2>
        {results.map((result) => (
          <div
            key={result.id}
            style={{
              backgroundColor: 'white',
              margin: '20px 0',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', color: '#4CAF50' }}>{result.title}</h3>
            <p style={{ margin: 0, color: '#555' }}>{result.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
