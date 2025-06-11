'use client';

import NoiseEffect from '../components/NoiseEffect.js';

export default function Home() {
  return (
    <div className="main-content" >
      <div className="titleCont">
        <h1 className="main-title" id="main-title">
          The Intelligent Copilot elevating your Bitcoin experience.
        </h1>
      </div>
      <NoiseEffect />
      <div className="vignette"></div>
    </div>
  )
}
