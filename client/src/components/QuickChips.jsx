const CHIPS = [
  'I am a farmer with 2 acres in Odisha',
  'I am a woman entrepreneur looking for a loan',
  'I need health insurance for my family',
  'I want a scholarship for my daughter',
  'I am 62 and need a pension scheme',
  'I want a housing loan subsidy'
];
 
export default function QuickChips({ onSelect }) {
  return (
    <div className="quick-chips">
      {CHIPS.map((chip) => (
        <button key={chip} onClick={() => onSelect(chip)}>{chip}</button>
      ))}
    </div>
  );
}
