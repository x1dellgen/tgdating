import { useRegistration } from '../../context/RegistrationContext';
import { AVAILABLE_INTERESTS } from '../../shared/constants';

export function StepInterests() {
  const { form, updateField } = useRegistration();
  const { interests } = form;

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      updateField('interests', interests.filter((i) => i !== interest));
    } else {
      updateField('interests', [...interests, interest]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-400 text-center">
        Выбери минимум 1 интерес
      </p>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_INTERESTS.map((interest) => {
          const isActive = interests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-600 text-white border border-violet-500'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      {interests.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Выбрано: {interests.length}
        </p>
      )}


    </div>
  );
}