"use client";
import React from "react";
import { Team } from "../../../services/teamservice";

interface LiveScoringPageProps {
  teams: Team[];
  setCurrentPage: (page: string) => void;
}

const LiveScoringPage: React.FC<LiveScoringPageProps> = ({ teams, setCurrentPage }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-white">Live Scoring & Standings</h2>
        <p className="text-gray-400">Team statistics and leaderboards</p>
      </div>
      <button
        onClick={() => setCurrentPage("home")}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Wins</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Losses</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {teams.map((team) => (
            <tr key={team.id}>
              <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-full object-cover border-2 border-green-400" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-green-400 flex items-center justify-center text-lg font-bold text-white">
                    {team.name.charAt(0)}
                  </div>
                )}
                <span className="text-white font-semibold">{team.name}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-green-400 font-bold">{team.wins}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-red-400 font-bold">{team.losses}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-blue-400 font-bold">{team.points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default LiveScoringPage;
