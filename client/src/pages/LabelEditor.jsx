import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLabelById, createLabel, updateLabel, previewLabel } from '../api/labels';
import FoodSearch from '../components/FoodSearch.jsx';
import NutritionLabelPreview from '../components/NutritionLabelPreview.jsx';

export default function LabelEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: '',
    serving_size: 100,
    serving_unit: 'g',
    servings_per_package: 1,
    total_weight: '',
    notes: '',
  });
  const [items, setItems] = useState([]);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) loadLabel();
  }, [id]);

  const loadLabel = async () => {
    try {
      const data = await getLabelById(id);
      setForm({
        name: data.name,
        serving_size: data.serving_size,
        serving_unit: data.serving_unit,
        servings_per_package: data.servings_per_package,
        total_weight: data.total_weight || '',
        notes: data.notes || '',
      });
      setItems(data.items.map((i) => ({
        food_id: i.food_id,
        food_name: i.food_name,
        weight_g: i.weight_g,
      })));
      setPreview(data);
    } catch {
      alert('載入標示失敗');
    }
  };

  const addItem = (food) => {
    setItems((prev) => [...prev, {
      food_id: food.id,
      food_name: food.name,
      weight_g: 100,
    }]);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePreview = async () => {
    if (items.length === 0) return alert('請至少加入一項食材');
    try {
      const data = await previewLabel({
        items,
        serving_size: parseFloat(form.serving_size),
        total_weight: form.total_weight ? parseFloat(form.total_weight) : undefined,
      });
      setPreview({
        ...form,
        ...data,
        perServing: data.perServing,
        allergen_statement: data.allergenStatement,
      });
    } catch {
      alert('計算失敗');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('請輸入產品名稱');
    if (items.length === 0) return alert('請至少加入一項食材');

    setSaving(true);
    try {
      const payload = {
        ...form,
        serving_size: parseFloat(form.serving_size),
        total_weight: form.total_weight ? parseFloat(form.total_weight) : undefined,
        servings_per_package: parseInt(form.servings_per_package),
        items,
      };

      if (isEditing) {
        await updateLabel(id, payload);
      } else {
        await createLabel(payload);
      }
      navigate('/');
    } catch {
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? '編輯營養標示' : '新增營養標示'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：表單 */}
        <div className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">基本資訊</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">產品名稱</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="例：巧克力蛋糕"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">每份量</label>
                  <input
                    type="number"
                    value={form.serving_size}
                    onChange={(e) => setForm({ ...form, serving_size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">單位</label>
                  <select
                    value={form.serving_unit}
                    onChange={(e) => setForm({ ...form, serving_unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="g">公克 (g)</option>
                    <option value="ml">毫升 (ml)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">每包裝份數</label>
                  <input
                    type="number"
                    value={form.servings_per_package}
                    onChange={(e) => setForm({ ...form, servings_per_package: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  總重量 (留空則自動加總)
                </label>
                <input
                  type="number"
                  value={form.total_weight}
                  onChange={(e) => setForm({ ...form, total_weight: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="自動計算"
                />
              </div>
            </div>
          </div>

          {/* 食材配方 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">食材配方</h3>
            <FoodSearch onSelect={addItem} />

            {items.length > 0 && (
              <div className="mt-4 space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                    <span className="flex-1 text-sm font-medium">{item.food_name}</span>
                    <input
                      type="number"
                      value={item.weight_g}
                      onChange={(e) => updateItem(idx, 'weight_g', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border rounded text-sm text-right"
                      min="0"
                    />
                    <span className="text-sm text-gray-500">g</span>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 備註 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">備註</h3>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              placeholder="選填..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              預覽計算
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '儲存中...' : '儲存標示'}
            </button>
          </div>
        </div>

        {/* 右側：預覽 */}
        <div>
          <h3 className="font-bold text-gray-700 mb-4">標示預覽 (台灣 FDA 格式)</h3>
          {preview ? (
            <NutritionLabelPreview label={preview} />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
              點擊「預覽計算」查看營養標示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
