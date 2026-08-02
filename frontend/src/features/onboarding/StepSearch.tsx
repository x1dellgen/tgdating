import { useRegistration } from '../../context/RegistrationContext';
import type { Gender } from '../../shared/constants';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Девушку' },
  { value: 'male', label: 'Парня' },
  { value: 'all', label: 'Всех' },
];

export function StepSearch() {
  const { form, updateField } = useRegistration();
  const { searchingFor } = form;

  const setGender = (gender: Gender) => {
    updateField('searchingFor', { ...searchingFor, gender });
  };

  const setAgeMin = (val: number) => {
    const clamped = Math.max(16, Math.min(val, searchingFor.ageRange[1]));
    updateField('searchingFor', { ...searchingFor, ageRange: [clamped, searchingFor.ageRange[1]] });
  };

  const setAgeMax = (val: number) => {
    const clamped = Math.min(99, Math.max(val, searchingFor.ageRange[0]));
    updateField('searchingFor', { ...searchingFor, ageRange: [searchingFor.ageRange[0], clamped] });
  };

  const setCity = (city: string) => {
    updateField('searchingFor', { ...searchingFor, city });
  };

  const toggleSearchEverywhere = () => {
    updateField('searchingFor', {
      ...searchingFor,
      searchEverywhere: !searchingFor.searchEverywhere,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Выбор пола */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Кого ищешь?</label>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGender(opt.value)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                searchingFor.gender === opt.value
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Диапазон возраста */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Возраст</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">От</label>
            <input
              type="number"
              value={searchingFor.ageRange[0]}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              min={16}
              max={searchingFor.ageRange[1]}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
          <span className="text-slate-500 mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">До</label>
            <input
              type="number"
              value={searchingFor.ageRange[1]}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              min={searchingFor.ageRange[0]}
              max={99}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Город */}
      <div className={searchingFor.searchEverywhere ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-sm text-slate-400 mb-1.5">Город для поиска</label>
        <input
          type="text"
          value={searchingFor.city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Москва"
          disabled={searchingFor.searchEverywhere}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors disabled:cursor-not-allowed"
        />
      </div>

      {/* Переключатель "Искать везде" */}
      <div
        onClick={toggleSearchEverywhere}
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        <button
          type="button"
          role="switch"
          aria-checked={searchingFor.searchEverywhere}
          onClick={toggleSearchEverywhere}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            searchingFor.searchEverywhere ? 'bg-blue-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              searchingFor.searchEverywhere ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-slate-300">Искать везде (без привязки к городу)</span>
      </div>
    </div>
  );
}
