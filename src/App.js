import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import SearchResults from "./SearchResults";
import ResultDetail from "./ResultDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results" element={<SearchResults />} />
      <Route path="/result-detail" element={<ResultDetail />} />
    </Routes>
  );
}

export default App;
