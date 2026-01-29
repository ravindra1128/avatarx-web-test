import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MobileNavigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    {
      id: 'dashboard',
      label: t('assistant.dashboard.title', 'Dashboard'),
      icon: Home,
      path: '/patient/dashboard'
    },
    // {
    //   id: 'vitals',
    //   label: t('assistant.heading', 'Assistant'),
    //   icon: MessageCircle,
    //   path: '/patient/assistant'
    // },
    // {
    //   id: 'diet',
    //   label: 'Diet',
    //   icon: Utensils,
    //   path: '/patient/check-calories'
    // },
    {
      id: 'history',
      label: t('assistant.history.title', 'History'),
      icon: Clock,
      path: '/profile'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    
    // Dispatch custom navigation event for modal components to listen to
    window.dispatchEvent(new CustomEvent('navigation', {
      detail: { pathname: path }
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[999999] shadow-lg" style={{ height: '50px', maxHeight: '50px' }}>
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 w-full"></div>
      
      {/* Navigation content */}
      <div className="flex justify-around items-center px-4 py-1 min-h-[50px]">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              className={`relative flex flex-col items-center cursor-pointer justify-center min-w-[60px] p-1 transition-all duration-200 ease-in-out group ${
                active 
                  ? 'transform -translate-y-1' 
                  : 'hover:transform hover:-translate-y-1'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {/* Active indicator line */}
              <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-0.5 rounded-full transition-all duration-200 ${
                active 
                  ? 'bg-black scale-100' 
                  : 'bg-transparent scale-0 group-hover:bg-gray-300 group-hover:scale-100'
              }`}></div>
              
              {/* Icon */}
              <IconComponent 
                className={`mb-0.5 transition-all duration-200 text-black group-hover:text-gray-700`}
                size={20}
              />
              
              {/* Label */}
              <span className={`text-xs font-medium text-center leading-tight transition-all duration-200 ${
                active 
                  ? 'text-black font-semibold' 
                  : 'text-gray-500 group-hover:text-gray-700'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;