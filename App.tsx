
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TroLyAI from './Tro_Ly_AI/App';
import AIOnThi from './AI_On_Thi';
import AITaoDeThi from './AI_Tao_De_Thi/App';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/tro-ly-ai" replace />} />
        <Route path="/tro-ly-ai" element={<TroLyAI />} />
        <Route path="/ai-on-thi" element={<AIOnThi />} />
        <Route path="/ai-tao-de-thi" element={<AITaoDeThi />} />
        <Route path="*" element={<Navigate to="/tro-ly-ai" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
