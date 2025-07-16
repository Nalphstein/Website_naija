"use client";
import React from 'react';

export const Footer = () => {
  const footerLinks = {
    games: ["League of Legends", "Valorant", "Wildrift", "FIFA"],
    community: ["Discord", "Forums", "Tournaments", "Teams"],
    social: [
      { name: "Twitter", icon: "fab fa-twitter" },
      { name: "Instagram", icon: "fab fa-instagram" },
      { name: "Discord", icon: "fab fa-discord" },
      { name: "YouTube", icon: "fab fa-youtube" },
    ]
  };

  return (
    <footer className="bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-orbitron text-xl font-bold mb-4 text-green-400">
            <img 
              src={"/League of Naija Logo.svg"} 
              alt="League of Naija Logo" 
              className="object-cover rounded-xl shadow-2xl"
            />
            </h3>
            <p className="text-gray-400">Nigeria's premier esports community platform.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Games</h4>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.games.map((game, index) => (
                <li key={index}>
                  <a href="#" className="hover:text-green-400 transition-colors duration-200">{game}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.community.map((item, index) => (
                <li key={index}>
                  <a href="#" className="hover:text-green-400 transition-colors duration-200">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {footerLinks.social.map((social, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="text-gray-400 hover:text-green-400 text-2xl transition-colors duration-200"
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 League of Naija. Built for Nigerian Gamers, by 3merald.</p>
        </div>
      </div>
    </footer>
  );
};