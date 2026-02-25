import React, { useState } from 'react';

const RANKINGS = [
  { rank: 'Five of a Kind', example: '4-4-4-4-4', desc: 'All five dice the same' },
  { rank: 'Four of a Kind', example: '3-3-3-3-6', desc: 'Four dice the same' },
  { rank: 'Full House', example: '5-5-5-2-2', desc: 'Three of one + pair of another' },
  { rank: 'Straight', example: '2-3-4-5-6', desc: 'Five consecutive values' },
  { rank: 'Three of a Kind', example: '6-6-6-2-4', desc: 'Three dice the same' },
  { rank: 'Two Pair', example: '3-3-5-5-1', desc: 'Two different pairs' },
  { rank: 'One Pair', example: '2-2-4-5-6', desc: 'Any two dice the same' },
  { rank: 'High Card', example: '1-3-4-5-6', desc: 'Nothing else; highest die wins' },
];

const HandRankings: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="hand-rankings">
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen(o => !o)}>
        {open ? '▲ HIDE RANKINGS' : '▼ HAND RANKINGS'}
      </button>
      {open && (
        <div className="hand-rankings__list">
          {RANKINGS.map((r, i) => (
            <div key={i} className="hand-rankings__row">
              <span className="hand-rankings__num">{i + 1}.</span>
              <span className="hand-rankings__name">{r.rank}</span>
              <span className="hand-rankings__example">{r.example}</span>
              <span className="hand-rankings__desc">{r.desc}</span>
            </div>
          ))}
          <div className="hand-rankings__note">Ties go against the player.</div>
        </div>
      )}
    </div>
  );
};

export default HandRankings;
