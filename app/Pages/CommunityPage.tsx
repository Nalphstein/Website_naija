"use client";
import React from 'react';
import { motion } from 'framer-motion';


export const CommunityPage = () => {

    const communityFeatures = [
        {
          title: "Discord Integration",
          description: "Join our active Discord community with voice channels, tournaments, and real-time chat.",
          icon: "fab fa-discord",
          buttonText: "Join Discord"
        },
        {
          title: "Community Forums",
          description: "Discuss strategies, share tips, and connect with players in dedicated game forums.",
          icon: "fas fa-comments",
          buttonText: "Enter Forums"
        },
        {
          title: "Voice Rooms",
          description: "Real-time voice communication for team coordination and casual gaming sessions.",
          icon: "fas fa-microphone",
          buttonText: "Join Voice"
        }
      ];
    const stats = [
        {number: "150+", label: "Members"},
        {number: "4", label: "Competitions"},
        {number: "2", label: "Gaming Leagues"},
    ];
    
    const games = [
        { name: "League of Legends", description: "Summoner's Rift",  image: "/image 65.png" },
        { name: "VALORANT", description: "Tactical Shooter", image: "/0x0.jpg" },
        { name: "Wildrift", description: "Mobile MOBA", icon: "fas fa-mobile-alt", image: "/jun-seong-park-juns-wild-rift-key-art 2.svg" },
        { name: "DOTA 2", description: "Strategic MOBA", icon: "fas fa-gem", image: "/703714285.jpg" },
        { name: "FIFA", description: "Football Simulation", icon: "fas fa-futbol", image: "/fifa-logo-fifa-world-cup-free-vector.jpg" },
        { name: "Apex Legends", description: "Battle Royale", icon: "fas fa-mountain", image: "/R.jpg" },
        { name: "CS:GO", description: "Classic FPS", icon: "fas fa-bomb",  image: "/587593.png" },
        { name: "Call of Duty", description: "Modern Warfare", icon: "fas fa-gun", image: "/Call_of_Duty_Mobile_604x423.jpg" },
        
    ];

    return (
        <div className="min-h-screen bg-black text-white">


            {/* Hero Section */}
            <div className="relative ">
                <div className="absolute inset-0 bg-black bg-no-repeat bg-cover "/>
                
                <div className="relative container mx-auto px-4 py-20">
                    <h1 className="text-4xl font-bold mb-6 text-wrap">
                        THE #1 LEAGUE OF LEGENDS COMMUNITY IN NIGERIA
                    </h1>

               
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-36">
                        {stats.map((stat, index) => (
                            <div 
                                key={index} 
                                className="bg-gray-800/80 rounded-lg p-6 text-center shadow-lg backdrop-blur-sm border border-gray-700 hover:border-blue-500 transition-colors duration-300"
                            >
                                <p className="text-4xl font-bold text-green-400">{stat.number}</p>
                                <p className="text-xl text-gray-300">{stat.label}</p>
                            </div>
                        ))}
                    </div>
<div className="container mx-auto px-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl font-bold mb-4 text-green-400">Community Engagement</h2>
          <p className="text-xl text-gray-400">Connect with fellow gamers across Nigeria and beyond</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {communityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-800 border border-green-400/20 rounded-xl p-8 text-center hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
            >
              <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className={`${feature.icon} text-3xl text-black`}></i>
              </div>
              <h3 className="font-orbitron text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-400 mb-6">{feature.description}</p>
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-green-400 text-black px-6 py-3 rounded-xl font-semibold w-full hover:bg-green-500 transition-all duration-300"
              >
                {feature.buttonText}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
                </div>

                {/* {partners section} */}

            </div>
    <section className="py-5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl font-bold mb-4 text-green-400">Featured Games</h2>
          {/* <p className="text-xl text-gray-400">Dominate the battlefield in Nigerias favorite esports titles</p> */}
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="bg-gray-900 border border-green-400/20 rounded-xl p-6 text-center hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
            >
              {/* <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${game.icon} text-2xl text-black`}></i>
              </div> */}
              <h3 className="uppercase font-orbitron font-bold text-lg mb-2">{game.name}</h3>
              <img src={game.image} alt={game.name} className='w-80 -full object-cover transform group-hover:scale-105 transition-transform duration-200'/>
              <p className="text-gray-400 text-sm mt-4">{game.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>



          {/* <div className="container mx-auto px-4 py-12 mt-20">
                    <div className="flex items-center justify-between space-x-8">
                        <div className="h-12 w-24 bg-gray-800 rounded-lg text-white">Riot Games</div>
                        <div className="h-12 w-24 bg-gray-800 rounded-lg">Riot Games</div>
                        <div className="h-12 w-24 bg-gray-800 rounded-lg">Riot Games</div>
                        <div className="h-12 w-24 bg-gray-800 rounded-lg">Riot Games</div>
                    </div>

                </div>
                <div className="bg-gradient container mx-auto px-4 py-16 mb-24 mt-24">
                    <h2 className="text-2xl font-bold mb-8">ACTIVE IN OTHER GAMES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-9 mt-16">
                        {games.map((game, index) => (
                            <div key={index} className="relative group mx-auto">
                                <div className="aspect-w-3 aspect-h--4 rounded-lg overflow-hidden">
                                    <img src={game.image} alt={game.title} className='w-80 -full object-cover transform group-hover:scale-105 transition-transform
                                     duration-200'/>
                                     <div className="absolute inset-0 bg-gradient-to-t from black/80 to-transparent"/>
                                     <div className="absolute bottom-4 left-4">
                                        <h3 className='text-xl font-bold'>{game.title}
                                            
                                        </h3>
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
         */}
        
        </div>
        
    )
}

export default CommunityPage


