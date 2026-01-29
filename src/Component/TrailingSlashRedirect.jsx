import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TrailingSlashRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const lastPathname = useRef(location.pathname);

  useEffect(() => {
    const { pathname } = location;
    
    // Reset redirect flag if pathname changed (not just a re-render)
    if (lastPathname.current !== pathname) {
      hasRedirected.current = false;
      lastPathname.current = pathname;
    }
    
    // If pathname ends with a slash and it's not the root path, and we haven't already redirected
    if (pathname.endsWith('/') && pathname !== '/' && !hasRedirected.current) {
      // Remove the trailing slash and navigate
      const newPath = pathname.slice(0, -1);
      hasRedirected.current = true;
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null; // This component doesn't render anything
};

export default TrailingSlashRedirect;