import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listLabels, deleteLabel } from '../api/labels';
import { getExcelExportUrl } from '../api/importExport';

export default function LabelList() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    try {
      const data = await listLabels();
      setLabels(data.data || []);
    } catch (err) {
      console.error('載入失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此標示？')) return;
    try {
      await deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const handleExportExcel = (id) => {
    window.open(getExcelExportUrl(id), '_blank');
  };

  if (loading) return <p className="text-gray-500">載入中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">營養標示列表</h2>
        <Link
          to="/label/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + 新增標示
        </Link>
      </div>

      {labels.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">尚無營養標示</p>
          <p className="text-sm mt-1">點擊「新增標示」開始建立</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">產品名稱</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">每份量</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">熱量</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">過敏原</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">更新時間</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {labels.map((label) => (
                <tr key={label.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{label.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {label.serving_size} {label.serving_unit}
                  </td>
                  <td className="px-4 py-3 text-sm">{label.calc_calories} kcal</td>
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      const allergens = Array.isArray(label.detected_allergens)
                        ? label.detected_allergens
                        : JSON.parse(label.detected_allergens || '[]');
                      return allergens.length > 0 ? (
                        <span className="text-red-600 text-xs">{allergens.join('、')}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">無</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(label.updated_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/label/${label.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleExportExcel(label.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
