import { Routes, Route, NavLink } from 'react-router-dom';
import LabelList from './pages/LabelList.jsx';
import LabelEditor from './pages/LabelEditor.jsx';
import AllergenManager from './pages/AllergenManager.jsx';
import FoodDataManager from './pages/FoodDataManager.jsx';

function Nav() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-800 mr-4">營養標示計算器</h1>
        <NavLink to="/" className={linkClass} end>標示列表</NavLink>
        <NavLink to="/label/new" className={linkClass}>新增標示</NavLink>
        <NavLink to="/food-data" className={linkClass}>食材資料庫</NavLink>
        <NavLink to="/allergens" className={linkClass}>過敏原管理</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<LabelList />} />
          <Route path="/label/new" element={<LabelEditor />} />
          <Route path="/label/:id" element={<LabelEditor />} />
          <Route path="/food-data" element={<FoodDataManager />} />
          <Route path="/allergens" element={<AllergenManager />} />
        </Routes>
      </main>
    </div>
  );
}
