import { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ptcLogo from '../../assets/ptc_logo.jpg';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInstallButton] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    ...(user?.role === 'admin' ? [
      { name: 'Rooms', href: '/admin/rooms', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ) },
      { name: 'Reports', href: '/admin/reports', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) }
    ] : []),
    ...(user?.role === 'professor' ? [
      { name: 'Scan Room', href: '/professor/scan', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m0 4h2m-2 4h2m-6-4h2m-2 4h2m-6-4h2m-2 4h2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5c0-1.1.9-2 2-2z" />
        </svg>
      ) },
      { name: 'Today', href: '/prof/today', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ) },
      { name: 'Reservations', href: '/prof/reservations', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) },
      { name: 'Reports', href: '/prof/reports', icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) }
    ] : [])
  ];

  // Helper component for navigation items
  const NavItem = ({ item }: { item: any }) => {
    const active = location.pathname === item.href;
    const baseClasses = "flex items-center w-full px-4 py-2 text-base transition-colors duration-150";
    const activeClasses = "text-primary bg-primary-lighter font-medium";
    const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-primary";

    return (
      <Link
        to={item.href}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      >
        {item.icon(active)}
        <span className={`ml-3 ${active ? 'font-medium' : ''}`}>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <Disclosure as="nav" className="bg-white shadow-sm lg:hidden">
        {({ open }) => (
          <>
            <div className="mx-auto px-4">
              <div className="flex h-16 justify-between">
                <div className="flex items-center">
                  <Link to="/" className="flex-shrink-0 flex items-center">
                    <img
                      src={ptcLogo}
                      alt="PTC Logo"
                      className="h-8 w-auto mr-2"
                    />
                    <span className="text-xl font-bold text-primary">SmartSched</span>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <Disclosure.Button 
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 touch-manipulation"
                    aria-label="Open main menu"
                  >
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel>
              <div className="border-t border-gray-200">
                <div className="space-y-1 py-3">
                  {navigation.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="px-4 mb-2">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.displayName || user?.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user?.role}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-base text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="ml-3">Sign out</span>
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Link to="/" className="flex items-center">
              <img
                src={ptcLogo}
                alt="PTC Logo"
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-bold text-primary">SmartSched</span>
            </Link>
          </div>
          <nav className="mt-5 flex-1 space-y-1 px-3 pb-4">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="ml-2">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:pl-64">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Install PWA prompt */}
      {showInstallButton && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-up border-t border-gray-200">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm font-medium">Install SmartSched app</span>
            <button
              id="install-button"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark transition-colors duration-150"
            >
              Install
            </button>
          </div>
        </div>
      )}
    </div>
  );
}