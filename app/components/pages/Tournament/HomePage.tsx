"use client";
import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Team } from "../../../services/teamservice";

interface HomePageProps {
  teams: Team[];
  setShowCreateModal: (show: boolean) => void;
  setCurrentPage: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ teams, setShowCreateModal, setCurrentPage }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-green-400 mb-2">League of Legends Tournament</h1>
        <p className="text-gray-400">Manage teams, track scores, and follow the bracket</p>
      </div>
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-green-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-green-500 transition-all duration-300 inline-flex items-center"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Team
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        onClick={() => setCurrentPage("team-management")}
        className="bg-gray-800 p-6 rounded-xl border border-green-400/20 hover:border-green-400/50 cursor-pointer transition-all duration-300"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-green-400 p-3 rounded-lg">
            <Plus className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Manage Teams</h2>
            <p className="text-gray-400 text-sm">Add, edit, or remove teams</p>
          </div>
        </div>
      </div>
      <div
        onClick={() => setCurrentPage("live-scoring")}
        className="bg-gray-800 p-6 rounded-xl border border-green-400/20 hover:border-green-400/50 cursor-pointer transition-all duration-300"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-green-400 p-3 rounded-lg">
            <Plus className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Live Scoring</h2>
            <p className="text-gray-400 text-sm">Track match results and standings</p>
          </div>
        </div>
      </div>
      <div
        onClick={() => setCurrentPage("bracket")}
        className="bg-gray-800 p-6 rounded-xl border border-green-400/20 hover:border-green-400/50 cursor-pointer transition-all duration-300"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-green-400 p-3 rounded-lg">
            <Plus className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Bracket</h2>
            <p className="text-gray-400 text-sm">View the tournament bracket</p>
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {teams.slice(0, 3).map((team) => (
        <motion.div
          key={team.id}
          className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-full object-cover border-2 border-green-400" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-green-400 flex items-center justify-center text-2xl font-bold text-white">
                {team.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{team.name}</h3>
              <div className="flex space-x-2 mt-2">
                {team.players.slice(0, 2).map((player, idx) => (
                  <span key={idx} className="bg-gray-700 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                    {player}
                  </span>
                ))}
                {team.players.length > 2 && (
                  <p className="text-gray-400 text-sm">... and {team.players.length - 2} more</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">W: {team.wins}</span>
              <span className="text-gray-400">L: {team.losses}</span>
              <span className="text-green-400">Pts: {team.points}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default HomePage;
