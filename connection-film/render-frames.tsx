import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {FilmFrame} from './src/Film';
const dest=process.argv[2] || 'frames';
mkdirSync(dest,{recursive:true});
const frames=process.argv[3]?(process.argv[3].includes(':')?(()=>{const [a,b]=process.argv[3].split(':').map(Number);return Array.from({length:b-a},(_,i)=>a+i)})():process.argv[3].split(',').map(Number)):Array.from({length:450},(_,i)=>i);
for(const frame of frames){
 const html=renderToStaticMarkup(<FilmFrame frame={frame}/>);
 const svg=html.slice(html.indexOf('<svg'),html.lastIndexOf('</svg>')+6).replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
 const png=new Resvg(svg,{fitTo:{mode:'width',value:1920},font:{loadSystemFonts:true}}).render().asPng();
 writeFileSync(`${dest}/${String(frame).padStart(4,'0')}.png`,png);
 if(frame%30===0 || frames.length<10)console.log(`Rendered ${frame}`);
}
