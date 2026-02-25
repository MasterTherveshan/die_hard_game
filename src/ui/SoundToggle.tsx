import React from 'react';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ enabled, onToggle }) => {
  return (
    <button
      className="btn btn--ghost btn--sm sound-toggle"
      onClick={onToggle}
      title={enabled ? 'Mute sound' : 'Enable sound'}
    >
      {enabled ? '🔊 SFX ON' : '🔇 SFX OFF'}
    </button>
  );
};

export default SoundToggle;
