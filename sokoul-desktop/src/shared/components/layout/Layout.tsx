// NAME — Layout.tsx — Role: Common layout component
// RULES: Integrates TitleBar and Navbar for content pages.

import * as React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import { TitleBar } from './TitleBar';
import { Navbar } from './Navbar';

const Layout: React.FC = () => { // LayoutProps no longer needed as children are rendered via Outlet
  return (
    <>
      <TitleBar />
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export { Layout };
