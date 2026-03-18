import { useState, useEffect } from 'react';
import { listAllergens, createAllergen, deleteAllergen } from '../api/allergens';

export default function AllergenManager() {
  const [allergens, setAllergens] = useState({});
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadAllergens();
  }, []);

  const loadAllergens = async () => {
    try {
      const data = await listAllergens();
      setAllergens(data);
      const cats = Object.keys(data);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]);
      }
    } catch (err) {
      console.error('載入過敏原失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const category = newCategory.trim() || selectedCategory;
    const keyword = newKeyword.trim();
    if (!category || !keyword) return alert('請填入分類與關鍵字');

    try {
      await createAllergen({ allergen_category: category, keyword });
      setNewKeyword('');
      setNewCategory('');
      await loadAllergens();
    } catch (err) {
      if (err.response?.status === 409) {
        alert('此關鍵字已存在');
      } else {
        alert('新增失敗');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除此關鍵字？')) return;
    try {
      await deleteAllergen(id);
      await loadAllergens();
    } catch {
      alert('刪除失敗');
    }
  };

  if (loading) return <p className="text-gray-500">載入中...</p>;

  const categories = Object.keys(allergens);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">過敏原關鍵字管理</h2>

      {/* 新增區 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-gray-700 mb-3">新增關鍵字</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">分類</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">或新增分類</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="留空則使用左側分類"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">關鍵字</label>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="例：蝦仁"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            新增
          </button>
        </div>
      </div>

      {/* 分類列表 */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat} className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold text-gray-700 mb-2">{cat}</h4>
            <div className="flex flex-wrap gap-2">
              {allergens[cat].map((kw) => (
                <span
                  key={kw.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded-full text-sm"
                >
                  {kw.keyword}
                  <button
                    onClick={() => handleDelete(kw.id)}
                    className="text-orange-400 hover:text-red-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
