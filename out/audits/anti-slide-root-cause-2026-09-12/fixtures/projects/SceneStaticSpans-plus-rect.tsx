import React from 'react';
export const SceneStaticSpans: React.FC = () => (
  <div style={{width: 1080, height: 1920}}>
    <span style={{fontSize: 48}}>Static heading</span>
    <span style={{fontSize: 34}}>Static explanatory text with no visual transformation.</span>
    <svg width={100} height={100}><rect x={0} y={0} width={100} height={100} /></svg>
  </div>
);
