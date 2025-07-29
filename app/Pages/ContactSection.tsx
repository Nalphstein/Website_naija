// import React from 'react';
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const ContactSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-green-400 to-black">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-orbitron text-4xl font-bold mb-6">Ready to Join the League?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Become part of Nigeria fastest-growing esports community. Compete in tournaments, build your team, and rise to glory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open("https://chat.whatsapp.com/CLH7TaTaGUD9KYlC3NvaAU?mode=r_t", "_blank")}
              className="bg-green-400 text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-500 transition-all duration-300"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Join our Whatsapp community
            </motion.button>
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-transparent border-2 border-green-400 text-green-400 px-8 py-4 rounded-xl font-semibold hover:bg-green-400 hover:text-black transition-all duration-300"
            >
              <i className="fas fa-info-circle mr-2"></i>
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
