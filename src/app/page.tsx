'use client';

import { Button } from '@/components/ui/button';
import NoiseEffect from '../components/NoiseEffect.js';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="main-content" >
      <div className="titleCont">
        <h1 className="main-title" id="main-title">
          Intelligent Copilot elevating your Bitcoin experience
        </h1>
        <Button size={'lg'} className='mt-3 relative z-50' onClick={() => router.push('/home')}>Getting Started</Button>
      </div>
      <NoiseEffect />
      <div className="vignette"></div>
    </div>
  )
}
