"use client";
import React from "react";
import { motion } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";
import { Team } from "../../../services/teamservice";

interface TeamManagementPageProps {
  teams: Team[];
  setCurrentPage: (page: string) => void;
  startEditingTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  loading: boolean;
}

const TeamManagementPage: React.FC<TeamManagementPageProps> = ({
  teams,
  setCurrentPage,
  startEditingTeam,
  deleteTeam,
  loading
}) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-white">Team Management</h2>
        <p className="text-gray-400">Manage teams and player transfers</p>
      </div>
      <button
        onClick={() => setCurrentPage("home")}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
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
                {team.players.slice(0,2).map((player, idx) => (
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
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => startEditingTeam(team)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => deleteTeam(team.id)}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between text-sm">
            <span className="text-gray-400">W: {team.wins}</span>
            <span className="text-gray-400">L: {team.losses}</span>
            <span className="text-green-400">Pts: {team.points}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default TeamManagementPage;
