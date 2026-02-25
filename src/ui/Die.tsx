import React, { useEffect, useState } from 'react';

interface DieProps {
  value: number;
  isRolling?: boolean;
  isHighlighted?: boolean;
  isSettled?: boolean;
  dim?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Die: React.FC<DieProps> = ({
  value,
  isRolling = false,
  isHighlighted = false,
  isSettled = false,
  dim = false,
  size = 'md',
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  // Pop animation on settle
  useEffect(() => {
    if (isSettled && !isRolling) {
      setScale(1.12);
      const t = setTimeout(() => setScale(1), 100);
      return () => clearTimeout(t);
    }
  }, [isSettled, isRolling]);

  // Jitter while rolling
  useEffect(() => {
    if (!isRolling) {
      setRotation(0);
      return;
    }
    const interval = setInterval(() => {
      setRotation((Math.random() - 0.5) * 8);
    }, 50);
    return () => clearInterval(interval);
  }, [isRolling]);

  const classNames = [
    'die',
    `die--${size}`,
    isRolling ? 'die--rolling' : '',
    isHighlighted ? 'die--highlighted' : '',
    isSettled && !isRolling ? 'die--settled' : '',
    dim ? 'die--dim' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transition: isRolling ? 'none' : 'transform 0.1s ease',
      }}
    >
      {value}
    </div>
  );
};

export default Die;
