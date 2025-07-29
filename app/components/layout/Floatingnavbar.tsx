"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Floatingnavbar() {
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items with their corresponding section IDs
  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Community', id: 'community' },
    { name: 'Tournaments', id: 'tournaments' },
    { name: 'Social', id: 'social' },
    { name: 'Contact', id: 'contact' },
  ];

  // Enhanced smooth scroll function with better error handling
  const scrollToSection = (sectionId) => {
    console.log('Attempting to scroll to:', sectionId);
    
    // First, try to find the element
    let element = document.getElementById(sectionId);
    
    // If not found, try alternative selectors
    if (!element) {
      element = document.querySelector(`#${sectionId}`);
    }
    
    // If still not found, try with different case or partial matching
    if (!element) {
      element = document.querySelector(`[id*="${sectionId}"]`);
    }
    
    if (element) {
      console.log('Element found:', element);
      console.log('Element offsetTop:', element.offsetTop);
      
      // Get current window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate dynamic offset based on screen size
      let offset;
      if (windowWidth < 640) { // sm
        offset = 60; // Smaller offset for mobile
      } else if (windowWidth < 1024) { // md to lg
        offset = 80; // Medium offset for tablets
      } else { // lg and up
        offset = 100; // Larger offset for desktop
      }
      
      // Calculate scroll position
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const targetScrollTop = Math.max(0, absoluteElementTop - offset);
      
      console.log('Window width:', windowWidth);
      console.log('Calculated offset:', offset);
      console.log('Target scroll position:', targetScrollTop);
      
      // Try multiple scroll methods for better compatibility
      try {
        // Method 1: Use scrollTo with behavior
        window.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
        // Fallback method for browsers that don't support smooth scrolling
        setTimeout(() => {
          const currentScroll = window.pageYOffset;
          if (Math.abs(currentScroll - targetScrollTop) > 10) {
            console.log('Fallback scroll method activated');
            // Manual smooth scroll implementation
            smoothScrollTo(targetScrollTop, 500);
          }
        }, 100);
        
      } catch (error) {
        console.error('Scroll error:', error);
        // Ultimate fallback
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    } else {
      console.error('Element not found with ID:', sectionId);
      console.log('Available sections on page:');
      navItems.forEach(item => {
        const testEl = document.getElementById(item.id);
        console.log(`- ${item.id}:`, testEl ? 'Found' : 'Not found');
      });
    }
    
    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
  };

  // Manual smooth scroll implementation for fallback
  const smoothScrollTo = (targetY, duration) => {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = new Date().getTime();

    const easeInOutQuart = (time, from, distance, duration) => {
      if ((time /= duration / 2) < 1) return distance / 2 * time * time * time * time + from;
      return -distance / 2 * ((time -= 2) * time * time * time - 2) + from;
    };

    const timer = setInterval(() => {
      const time = new Date().getTime() - startTime;
      const newY = easeInOutQuart(time, startY, distance, duration);
      if (time >= duration) {
        clearInterval(timer);
        window.scrollTo(0, targetY);
      } else {
        window.scrollTo(0, newY);
      }
    }, 1000 / 60); // 60 fps
  };

  // Enhanced scroll tracking with better section detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // If we're near the bottom of the page, set the last section as active
      if (scrollPosition + windowHeight >= documentHeight - 100) {
        const lastSection = navItems[navItems.length - 1].id;
        if (activeSection !== lastSection) {
          setActiveSection(lastSection);
        }
        return;
      }

      // Find the section that's currently most visible
      const sections = navItems.map(item => {
        const element = document.getElementById(item.id);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        const elementHeight = rect.height;
        
        // Calculate how much of the element is visible
        const visibleTop = Math.max(0, -elementTop);
        const visibleBottom = Math.min(elementHeight, windowHeight - elementTop);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityRatio = visibleHeight / elementHeight;
        
        return {
          id: item.id,
          visibilityRatio,
          distanceFromTop: Math.abs(elementTop),
          elementTop
        };
      }).filter(Boolean);

      if (sections.length > 0) {
        // Find the section that's most visible or closest to the top
        const currentSection = sections.reduce((prev, current) => {
          // Prefer sections that are more visible
          if (current.visibilityRatio > prev.visibilityRatio + 0.1) {
            return current;
          }
          // If visibility is similar, prefer the one closer to the top
          if (Math.abs(current.visibilityRatio - prev.visibilityRatio) < 0.1) {
            return current.distanceFromTop < prev.distanceFromTop ? current : prev;
          }
          return prev;
        });

        if (currentSection && activeSection !== currentSection.id) {
          setActiveSection(currentSection.id);
        }
      }
    };

    // Throttle scroll events for better performance
    let scrollTimeout;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 10);
    };

    window.addEventListener('scroll', throttledScroll);
    
    // Initial call to set active section
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [activeSection, navItems]);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

;

  return (
    <>
      {/* Desktop & Tablet Navbar (md and up) */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-md rounded-full px-4 md:px-6 py-3 border border-gray-700/50 shadow-lg shadow-black/20"
      >
        <ul className="flex space-x-1 md:space-x-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToSection(item.id)}
                className={`relative px-3 md:px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm md:text-base ${
                  activeSection === item.id
                    ? 'text-black bg-green-400 shadow-lg shadow-green-400/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.name}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-green-400 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </motion.nav>

      {/* Mobile Hamburger Button (sm and below) */}
      <motion.button
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur-md rounded-full p-3 border border-gray-700/50 shadow-lg shadow-black/20"
      >
        <Menu className="w-6 h-6 text-white" />
      </motion.button>

      {/* Mobile Full-Screen Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center mobile-menu-container"
          >
            {/* Close Button */}
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ delay: 0.1 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 bg-gray-900/80 rounded-full p-3 border border-gray-700/50"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>

            {/* Mobile Navigation Items */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center space-y-6 max-w-sm w-full px-4"
            >
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-2xl font-bold py-4 px-6 rounded-xl transition-all duration-300 text-center ${
                    activeSection === item.id
                      ? 'text-black bg-green-400 shadow-lg shadow-green-400/30'
                      : 'text-white hover:text-green-400 hover:bg-gray-800/30'
                  }`}
                >
                  {item.name}
                </motion.button>
              ))}


            </motion.div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-400 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-green-400 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}