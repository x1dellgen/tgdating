import { PLACEHOLDER_TEXTS } from '../../shared/constants';
import '../../shared/placeholder.css';

export function DatingScreen() {
  return (
    <div className="placeholder-screen">
      <p className="placeholder-text">{PLACEHOLDER_TEXTS.swipes}</p>
    </div>
  );
}