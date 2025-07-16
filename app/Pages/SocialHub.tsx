// import React from 'react';
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const SocialHub = () => {
  const socialPlatforms = [
    { name: "Twitch", icon: "fab fa-twitch", color: "bg-purple-600" },
    { name: "YouTube", icon: "fab fa-youtube", color: "bg-red-600" },
    { name: "TikTok", icon: "fab fa-tiktok", color: "bg-gray-800" },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gray-800 border border-green-400/20 rounded-xl p-8 hover:border-green-400 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mb-6">
              <i className="fas fa-share-alt text-2xl text-black"></i>
            </div>
            <h2 className="font-orbitron text-3xl font-bold mb-4 text-green-400">Social Hub</h2>
            <p className="text-gray-300 mb-6 text-lg">
              Connect with streamers, post highlights, follow players, and share moments on your timeline. Integrates with Twitch, YouTube, and TikTok.
            </p>
            <div className="flex space-x-4 mb-6">
              {socialPlatforms.map((platform, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={`${platform.color} p-3 rounded-lg cursor-pointer`}
                >
                  <i className={`${platform.icon} text-2xl`}></i>
                </motion.div>
              ))}
            </div>
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-green-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-green-500 transition-all duration-300"
            >
              <i className="fas fa-link mr-2"></i>
              Connect Accounts
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img 
              src="https://media.istockphoto.com/id/1348326274/tr/foto%C4%9Fraf/brothers-watching-sports-or-playing-on-the-smartphone-at-the-mall.jpg?s=612x612&w=0&k=20&c=wKJzEZMunrihur9cSMfcNu6t50RX6to6gbqe3Ma_naE=" 
              alt="Gaming Social Hub" 
              className="w-full h-96 object-cover rounded-xl shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default SocialHub;
