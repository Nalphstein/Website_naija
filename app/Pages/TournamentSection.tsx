"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Plus, X, Upload, Save, Trash2, Play, ArrowRight, Edit } from 'lucide-react';
import { 
  Team,
  createTeam, 
  getAllTeams, 
  updateTeam, 
  deleteTeam as deleteTeamService, 
  uploadTeamLogo 
} from '../services/teamservice';
import HomePage from '../components/pages/Tournament/HomePage';
import TeamManagementPage from '../components/pages/Tournament/TeamManagementPage';
import LiveScoringPage from '../components/pages/Tournament/LiveScoringPage';
import BracketPage from '../components/pages/Tournament/BracketPage';

type Match = {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  score1: number;
  score2: number;
  status: 'pending' | 'completed';
};

type Tournament = {
  id: string;
  teams: Team[];
  rounds: Match[][];
  status: 'active' | 'completed';
  createdAt: string;
};

export const TournamentSection = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Omit<Team, 'id'>>({
    name: '',
    logo: null,
    players: ['', '', '', '', '',''],
    wins: 0,
    losses: 0,
    points: 0,
  });

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const fetchedTeams = await getAllTeams();
        setTeams(fetchedTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        alert('Error loading teams. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []); 

  // Missing functions
  const startEditingTeam = (team: Team) => {
    setEditingTeam(team);
    setCurrentTeam({
      name: team.name,
      logo: team.logo,
      players: [...team.players],
      wins: team.wins,
      losses: team.losses,
      points: team.points,
    });
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...currentTeam.players];
    newPlayers[index] = value;
    setCurrentTeam({ ...currentTeam, players: newPlayers });
  };

  const handleUpdateTeam = async () => {
  if (editingTeam && currentTeam.name && currentTeam.players.some(p => p.trim())) {
    setLoading(true);
    try {
      await updateTeam(editingTeam.id, {
        ...currentTeam,
        players: currentTeam.players.filter(p => p.trim()),
      });
      const fetchedTeams = await getAllTeams();
      setTeams(fetchedTeams);
      setEditingTeam(null);
      setCurrentTeam({ name: '', logo: null, players: ['', '', '', '', ''], wins: 0, losses: 0, points: 0 });
    } catch (error) {
      alert('Error updating team. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};

  const generateBracket = () => {
    // Simple bracket generation logic (needs implementation)
    alert("Bracket generation would be implemented here");
    setTournament({
      id: '1',
      teams,
      rounds: [],
      status: 'active',
      createdAt: new Date().toISOString()
    });
  };

  const handleCreateTeam = async () => {
  if (currentTeam.name && currentTeam.players.some(p => p.trim())) {
    setLoading(true);
    try {
      await createTeam({
        name: currentTeam.name,
        logo: currentTeam.logo,
        players: currentTeam.players.filter(p => p.trim()),
        wins: 0,
        losses: 0,
        points: 0,
      });
      const fetchedTeams = await getAllTeams();
      setTeams(fetchedTeams);
      setCurrentTeam({ name: '', logo: null, players: ['', '', '', '', ''], wins: 0, losses: 0, points: 0 });
      setShowCreateModal(false);
      setCurrentPage('team-management');
    } catch (error) {
      alert('Error creating team. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};

  const deleteTeam = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      setLoading(true);
      try {
        await deleteTeamService(teamId);
        setTeams(teams.filter(team => team.id !== teamId));
      } catch (error) {
        alert('Error deleting team. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const logoUrl = await uploadTeamLogo(file);
    setCurrentTeam({ ...currentTeam, logo: logoUrl });
  };

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'team-management':
        return <TeamManagementPage 
          teams={teams}
          setCurrentPage={setCurrentPage}
          startEditingTeam={startEditingTeam}
          deleteTeam={deleteTeam}
          loading={loading}
        />;
      case 'live-scoring':
        return <LiveScoringPage 
          teams={teams}
          setCurrentPage={setCurrentPage}
        />;
      case 'bracket':
        return <BracketPage 
          teams={teams}
          setTeams={setTeams}
          tournament={tournament}
          setTournament={setTournament}
          generateBracket={generateBracket}
          setCurrentPage={setCurrentPage}
        />;
      default:
        return <HomePage 
          teams={teams}
          setShowCreateModal={setShowCreateModal}
          setCurrentPage={setCurrentPage}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <section className="py-16">
        <div className="container mx-auto px-4">
          {renderCurrentPage()}
        </div>
      </section>

      {/* Create/Edit Team Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTeam) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingTeam ? 'Edit Team' : 'Create Team'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTeam(null);
                    setCurrentTeam({ name: '', logo: null, players: ['', '', '', '', ''], wins: 0, losses: 0, points: 0 });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={currentTeam.name}
                    onChange={(e) => setCurrentTeam({ ...currentTeam, name: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Logo</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </label>
                    {currentTeam.logo && (
                      <img src={currentTeam.logo} alt="Logo preview" className="w-10 h-10 rounded-full object-cover" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Players</label>
                  <div className="space-y-2">
                    {currentTeam.players.map((player, index) => (
                      <input
                        key={index}
                        type="text"
                        value={player}
                        onChange={(e) => handlePlayerChange(index, e.target.value)}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
                        placeholder={`Player ${index + 1} name`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    disabled={loading}
                    className="flex-1 bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {loading ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTeam(null);
                      setCurrentTeam({ name: '', logo: null, players: ['', '', '', '', ''], wins: 0, losses: 0, points: 0 });
                    }}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentSection;