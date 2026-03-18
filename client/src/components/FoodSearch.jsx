import { useState, useEffect, useRef } from 'react';
import { searchFoods } from '../api/nutritionData';

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchFoods({ q: query, limit: 15 });
        setResults(data.data || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
    }, 300);
  }, [query]);

  const handleSelect = (food) => {
    onSelect(food);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="搜尋食材名稱..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {results.map((food) => (
            <li
              key={food.id}
              onMouseDown={() => handleSelect(food)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
            >
              <span className="font-medium">{food.name}</span>
              {food.category && (
                <span className="ml-2 text-xs text-gray-400">{food.category}</span>
              )}
              <span className="ml-2 text-xs text-gray-500">{food.calories} kcal/100g</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
