// NAME — Layout.tsx — Role: Common layout component
// RULES: Integrates TitleBar and Navbar for content pages.

import * as React from 'react';
import { TitleBar } from './TitleBar';
import { Navbar } from './Navbar';
import { AnimatedOutlet } from '@/app/AnimatedOutlet';
import { ToastContainer } from '@/shared/components/ui/Toast';

const Layout: React.FC = () => {
  return (
    <>
      <TitleBar />
      <Navbar />
      <main>
        <AnimatedOutlet />
      </main>
      <ToastContainer />
    </>
  );
};

export { Layout };
