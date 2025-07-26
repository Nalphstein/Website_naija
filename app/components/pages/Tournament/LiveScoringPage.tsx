"use client";
import React from "react";
import { Team } from "../../../services/teamservice";

interface LiveScoringPageProps {
  teams: Team[];
  setCurrentPage: (page: string) => void;
}

const LiveScoringPage: React.FC<LiveScoringPageProps> = ({ teams, setCurrentPage }) => {
  // Sort teams by points (highest first), then by wins as tiebreaker, then by name
  const sortedTeams = [...teams].sort((a, b) => {
    // Primary sort: Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    
    // Secondary sort: Wins (descending) - tiebreaker
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    
    // Tertiary sort: Losses (ascending) - fewer losses is better
    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }
    
    // Final sort: Team name (alphabetical)
    return a.name.localeCompare(b.name);
  });

  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return "🥇"; // Gold medal for 1st
      case 1: return "🥈"; // Silver medal for 2nd  
      case 2: return "🥉"; // Bronze medal for 3rd
      default: return `#${index + 1}`; // Regular ranking number
    }
  };

  const getRankingColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-400"; // Gold
      case 1: return "text-gray-300"; // Silver
      case 2: return "text-amber-600"; // Bronze
      default: return "text-gray-400"; // Regular
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Scoring & Standings</h2>
          <p className="text-gray-400">Team statistics and leaderboards (ranked by points)</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Wins</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Losses</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedTeams.map((team, index) => (
              <tr key={team.id} className={index < 3 ? "bg-gray-750" : ""}>
                {/* Rank Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`font-bold text-lg ${getRankingColor(index)}`}>
                    {getRankingIcon(index)}
                  </div>
                </td>
                
                {/* Team Info */}
                <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                  {team.logo ? (
                    <img 
                      src={team.logo} 
                      alt={team.name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-400" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-green-400 flex items-center justify-center text-lg font-bold text-white">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-white font-semibold">{team.name}</span>
                  {index === 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      LEADER
                    </span>
                  )}
                </td>
                
                {/* Stats */}
                <td className="px-6 py-4 text-center">
                  <span className="text-green-400 font-bold">{team.wins}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-red-400 font-bold">{team.losses}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-blue-400 font-bold text-lg">{team.points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Additional Stats Summary */}
      {sortedTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {sortedTeams[0]?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-400">Current Leader</div>
            <div className="text-lg text-blue-400 font-semibold">
              {sortedTeams[0]?.points || 0} points
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.max(...teams.map(t => t.wins))}
            </div>
            <div className="text-sm text-gray-400">Most Wins</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {teams.reduce((total, team) => total + team.points, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Points</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoringPage;