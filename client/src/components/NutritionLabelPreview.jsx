import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { round } from '../lib/utils';

export default function NutritionLabelPreview({ label, onExportPng }) {
  const labelRef = useRef(null);

  const handleExportPng = async () => {
    if (!labelRef.current) return;
    const canvas = await html2canvas(labelRef.current, { scale: 2, backgroundColor: '#fff' });
    const link = document.createElement('a');
    link.download = `${label.name || '營養標示'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!label) return null;

  const perServing = label.perServing || label;
  const calories = perServing.calc_calories ?? perServing.calories ?? 0;
  const protein = perServing.calc_protein ?? perServing.protein ?? 0;
  const totalFat = perServing.calc_total_fat ?? perServing.total_fat ?? 0;
  const saturatedFat = perServing.calc_saturated_fat ?? perServing.saturated_fat ?? 0;
  const transFat = perServing.calc_trans_fat ?? perServing.trans_fat ?? 0;
  const totalCarbs = perServing.calc_total_carbs ?? perServing.total_carbs ?? 0;
  const sugar = perServing.calc_sugar ?? perServing.sugar ?? 0;
  const dietaryFiber = perServing.calc_dietary_fiber ?? perServing.dietary_fiber ?? 0;
  const sodium = perServing.calc_sodium ?? perServing.sodium ?? 0;

  const servingSize = label.serving_size || 0;
  const servingUnit = label.serving_unit || 'g';
  const servingsPerPackage = label.servings_per_package || 1;
  const allergenStatement = label.allergen_statement || label.allergenStatement || '';

  const Row = ({ name, value, unit, indent, bold, thick }) => (
    <tr className={`${thick ? 'border-t-4 border-black' : 'border-t border-gray-400'}`}>
      <td className={`py-1 ${indent ? 'pl-6' : ''} ${bold ? 'font-bold' : ''}`}>{name}</td>
      <td className={`py-1 text-right ${bold ? 'font-bold' : ''}`}>{round(value)} {unit}</td>
    </tr>
  );

  return (
    <div>
      <div
        ref={labelRef}
        className="bg-white border-2 border-black p-4 w-80 text-sm"
        style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
      >
        <h2 className="text-center text-lg font-bold border-b-4 border-black pb-1 mb-2">
          營養標示
        </h2>
        <p className="text-sm mb-1">每一份量 {round(servingSize)} {servingUnit}</p>
        <p className="text-sm mb-2 border-b-4 border-black pb-2">
          本包裝含 {servingsPerPackage} 份
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-1 font-bold">　</th>
              <th className="text-right py-1 font-bold">每份</th>
            </tr>
          </thead>
          <tbody>
            <Row name="熱量" value={calories} unit="kcal" bold thick />
            <Row name="蛋白質" value={protein} unit="g" />
            <Row name="脂肪" value={totalFat} unit="g" bold thick />
            <Row name="飽和脂肪" value={saturatedFat} unit="g" indent />
            <Row name="反式脂肪" value={transFat} unit="g" indent />
            <Row name="碳水化合物" value={totalCarbs} unit="g" bold thick />
            <Row name="糖" value={sugar} unit="g" indent />
            <Row name="膳食纖維" value={dietaryFiber} unit="g" indent />
            <Row name="鈉" value={sodium} unit="mg" thick />
          </tbody>
        </table>
        {allergenStatement && (
          <p className="mt-3 pt-2 border-t-2 border-black text-xs text-red-700 font-medium">
            {allergenStatement}
          </p>
        )}
      </div>
      <button
        onClick={handleExportPng}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
      >
        下載 PNG
      </button>
    </div>
  );
}
