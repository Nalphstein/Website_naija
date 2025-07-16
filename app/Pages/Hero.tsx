// import React from "react"
// import styles from './Hero.module.css'

// const Hero = () => {
//   return (
//     <section id="home" className={`relative h-screen w-full ${styles['hero-section']}`}>
//       <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
//         <h1 className="text-6xl font-bold">WELCOME</h1>
//         <h2 className="text-5xl font-extrabold mt-44">LEAGUE OF NAIJA</h2>
//         <p className="mt-4 text-lg font-light">
//           Explore ongoing leagues or become a part of the action.
//         </p>
//         <button className="mt-8 px-6 py-3 bg-blue-500 rounded-full text-lg font-semibold hover:bg-blue-600">
//           Join the League
//         </button>
//       </div>

//       <div className="absolute bottom-7 right-9 w-40 h-40 flex items-center justify-center">
//         <div className="absolute inset-0 flex items-center justify-center">
//           <svg
//             className="w-full h-full"
//             viewBox="0 0 100 100"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               id="circlePath"
//               d="M50,10 a40,40 0 1,1 -0.1,0"
//             />
//             <text
//               fill="white"
//               fontSize="13"
//               letterSpacing="1.9"
//             >
//               <textPath xlinkHref="#circlePath">
//                 EXPLORE ONGOING LEAGUES
//               </textPath>
//             </text>
//           </svg>
//         </div>
//       </div>
//     </section>
//   );
// };




// components/HeroSection.tsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import styles from './Hero.module.css';
export const Hero = () => {
  return (
    <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-black ${styles['hero-section']}`}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content text-center lg:text-left"
          >
            <h1 className="font-orbitron text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Welcome to<span className="text-green-400"> the
              <img 
              src={"/League of Naija Logo.svg"} 
              alt="League of Naija Logo" 
              className="object-cover rounded-xl shadow-2xl"
            />
            </span>
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Nigeria premier destination for esports, gaming events, and community. Compete, stream, and rise to glory with fellow Naija gamers.
            </p>
            <div className="mb-8">
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-green-400 text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-500 transition-all duration-300 shadow-lg hover:shadow-green-400/30"
              >
                <i className="fas fa-rocket mr-2"></i>
                Join the League
              </motion.button>
            </div>
            {/* <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <span className="bg-green-400/10 border border-green-400/30 px-4 py-2 rounded-full text-sm">
                <i className="fas fa-trophy mr-2"></i>
                Top Naija Esports Hub - IGN
              </span>
              <span className="bg-green-400/10 border border-green-400/30 px-4 py-2 rounded-full text-sm">
                <i className="fas fa-users mr-2"></i>
                Massive Community - GameSpot
              </span>
              <span className="bg-green-400/10 border border-green-400/30 px-4 py-2 rounded-full text-sm">
                <i className="fas fa-gamepad mr-2"></i>
                Next-Level Tournaments - Eurogamer
              </span>
            </div> */}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-image"
          >
            <img 
              src={"/image 48.png"}
              alt="Nigerian Gamer" 
              className="w-full h-96 object-cover rounded-xl shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
