import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Footer from './Footer';
import UserForm from './UserForm';

function Layout() {
  const [userFormOpen, setUserFormOpen] = useState(false);

  return (
    <>
      <Navbar onUserIconClick={() => setUserFormOpen(true)} />
      <main>
        <Outlet />
      </main>
      <Footer />
      <UserForm isOpen={userFormOpen} onClose={() => setUserFormOpen(false)} />
      <Toaster position="top-right" />
    </>
  );
}

export default Layout;
