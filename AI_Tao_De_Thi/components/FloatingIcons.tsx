import React from 'react';

const icons = [
  { emoji: '🧪', position: 'left-0 top-10', rotation: '-rotate-25' },
  { emoji: '✏️', position: 'left-[15%] top-0', rotation: '-rotate-15' },
  { emoji: '⚛️', position: 'left-[35%] -top-4', rotation: 'rotate-0' },
  { emoji: '🖍️', position: 'right-[35%] -top-4', rotation: 'rotate-0' },
  { emoji: '🌎', position: 'right-[15%] top-0', rotation: 'rotate-15' },
  { emoji: '📖', position: 'right-0 top-10', rotation: 'rotate-25' },
];

const FloatingIcons: React.FC = () => (
  <div className="absolute top-12 md:top-16 lg:top-20 w-full max-w-4xl h-24 pointer-events-none z-0">
    {icons.map((icon, index) => (
      <div 
        key={index} 
        className={`absolute transform transition-transform duration-500 ${icon.position} ${icon.rotation}`}
      >
        <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
          <span className="text-3xl lg:text-4xl">{icon.emoji}</span>
        </div>
      </div>
    ))}
  </div>
);

export default FloatingIcons;
