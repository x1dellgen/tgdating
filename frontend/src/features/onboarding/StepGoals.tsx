import { useRegistration } from '../../context/RegistrationContext';
import { AVAILABLE_RELATIONSHIP_GOALS } from '../../shared/constants';

export function StepGoals() {
  const { form, updateField } = useRegistration();
  const { relationshipGoals } = form;

  const toggleGoal = (goal: string) => {
    if (relationshipGoals.includes(goal)) {
      updateField('relationshipGoals', relationshipGoals.filter((g) => g !== goal));
    } else {
      updateField('relationshipGoals', [...relationshipGoals, goal]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-400 text-center">
        Что для тебя важно? (можно выбрать несколько)
      </p>

      <div className="flex flex-col gap-2">
        {AVAILABLE_RELATIONSHIP_GOALS.map((goal) => {
          const isActive = relationshipGoals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`w-full px-5 py-3.5 rounded-xl text-left text-sm font-medium transition-all ${
                isActive
                  ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all ${
                    isActive
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-slate-600'
                  }`}
                >
                  {isActive ? '✓' : ''}
                </span>
                {goal}
              </span>
            </button>
          );
        })}
      </div>

      {relationshipGoals.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Выбрано: {relationshipGoals.length}
        </p>
      )}


    </div>
  );
}