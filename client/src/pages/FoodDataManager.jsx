import { useState, useEffect, useRef } from 'react';
import { searchFoods, deleteFood } from '../api/nutritionData';
import { importExcel } from '../api/importExport';

export default function FoodDataManager() {
  const [foods, setFoods] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);
  const limit = 20;

  useEffect(() => {
    loadFoods();
  }, [page, query]);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const data = await searchFoods({ q: query, limit, offset: page * limit });
      setFoods(data.data || []);
      setTotal(data.total || 0);
    } catch {
      console.error('載入食材失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return alert('請選擇 Excel 檔案');

    setUploading(true);
    setImportResult(null);
    try {
      const data = await importExcel(file);
      setImportResult(data);
      fileRef.current.value = '';
      loadFoods();
    } catch (err) {
      alert('匯入失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除此食材？')) return;
    try {
      await deleteFood(id);
      loadFoods();
    } catch {
      alert('刪除失敗');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">食材資料庫</h2>

      {/* Excel 匯入 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-gray-700 mb-3">匯入衛福部食品成分資料庫 (Excel)</h3>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="text-sm"
          />
          <button
            onClick={handleImport}
            disabled={uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {uploading ? '匯入中...' : '開始匯入'}
          </button>
        </div>
        {importResult && (
          <p className="mt-2 text-sm text-green-600">
            匯入完成：共 {importResult.total} 筆，成功匯入 {importResult.imported} 筆
          </p>
        )}
      </div>

      {/* 搜尋 */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="搜尋食材名稱..."
          className="w-full max-w-md px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="ml-3 text-sm text-gray-500">共 {total} 筆</span>
      </div>

      {/* 食材表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600">名稱</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600">分類</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600">來源</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">熱量</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">蛋白質</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">脂肪</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">碳水</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">鈉</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">載入中...</td></tr>
            ) : foods.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">無資料</td></tr>
            ) : (
              foods.map((food) => (
                <tr key={food.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{food.name}</td>
                  <td className="px-3 py-2 text-gray-500">{food.category || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${food.source === 'official' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {food.source === 'official' ? '衛福部' : '自訂'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{food.calories}</td>
                  <td className="px-3 py-2 text-right">{food.protein}</td>
                  <td className="px-3 py-2 text-right">{food.total_fat}</td>
                  <td className="px-3 py-2 text-right">{food.total_carbs}</td>
                  <td className="px-3 py-2 text-right">{food.sodium}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(food.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 border rounded text-sm disabled:opacity-30"
          >
            上一頁
          </button>
          <span className="text-sm text-gray-600">
            第 {page + 1} / {totalPages} 頁
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-30"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
