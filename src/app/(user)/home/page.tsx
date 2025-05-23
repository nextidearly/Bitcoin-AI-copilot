import { Metadata } from 'next';

import { HomeContent } from './home-content';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your AI assistant for everything Bitcoin',
};

export default function HomePage() {
  return <HomeContent />;
}
