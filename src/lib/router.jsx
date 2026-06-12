// Лёгкий hash-роутер без внешних зависимостей.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const RouteContext = createContext({ path: '/', navigate: () => {} });

export function RouterProvider({ children }) {
  const [path, setPath] = useState(
    () => window.location.hash.slice(1) || '/',
  );

  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
  }, []);

  return (
    <RouteContext.Provider value={{ path, navigate }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  return useContext(RouteContext);
}

export function Link({ to, children, className = '', ...rest }) {
  const { path } = useRoute();
  const active = path === to;
  return (
    <a
      href={'#' + to}
      className={`${className}${active ? ' active' : ''}`}
      {...rest}
    >
      {children}
    </a>
  );
}
