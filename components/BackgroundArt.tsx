import React from 'react';

const BackgroundArt = () => {
  return (
    <div className="bg-art">
      <div className="art-node node-tl">
        <div className="node-dot" />
      </div>
      <div className="art-node node-tr">
        <div className="node-dot" />
      </div>
      <div className="art-node node-bl">
        <div className="node-dot" />
      </div>
      <div className="art-node node-br">
        <div className="node-dot" />
      </div>

      <svg className="art-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {/* Top Left Path */}
        <path className="art-line" d="M140,100 L300,100 L400,200 L400,400" />
        {/* Top Right Path */}
        <path className="art-line" d="M860,100 L700,100 L600,200 L600,400" />
        {/* Bottom Left Path */}
        <path className="art-line" d="M140,900 L300,900 L400,800 L400,600" />
        {/* Bottom Right Path */}
        <path className="art-line" d="M860,900 L700,900 L600,800 L600,600" />
      </svg>
    </div>
  );
};

export default BackgroundArt;
