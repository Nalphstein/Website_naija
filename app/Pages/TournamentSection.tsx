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
import { getTournament,updateTournament, TournamentType } from '../services/tournamentService';
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
  const [tournament, setTournament] = useState<TournamentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(true);
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
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [loadedTeams, savedTournament] = await Promise.all([
          getAllTeams(),
          getTournament('current')
        ]);
        
        setTeams(loadedTeams);
        if (savedTournament) {
          setTournament(savedTournament);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        setTournamentLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!tournamentLoading && tournament) {
      const saveCurrentTournament = async () => {
        try {
          if (tournament.id) {
            await updateTournament(tournament.id, tournament);
          } 
        } catch (error) {
          console.error('Error saving tournament:', error);
        }
      };
      
      saveCurrentTournament();
    }
  }, [tournament, tournamentLoading]);

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

  const handleGenerateBracket = async () => {
    if (teams.length < 2) {
      alert('You need at least 2 teams to generate a bracket');
      return;
    }
    
    const newTournament: TournamentType = {
      id: 'current',
      name: 'Tournament ' + new Date().toLocaleDateString(),
      teams,
      rounds: [],
      status: 'active',
      currentWeek: 1,
      createdAt: new Date().toISOString()
    };
    
    setTournament(newTournament);
    
    // If you want to save to Firebase
    try {
      await updateTournament('current', newTournament);
    } catch (error) {
      console.error('Error saving tournament:', error);
    }
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
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    try {
      setLoading(true);
      const logoUrl = await uploadTeamLogo(file, currentTeam.name || 'team');
      setCurrentTeam({ ...currentTeam, logo: logoUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const renderCurrentPage = () => {
    if (loading || tournamentLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

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
        console.log("Tournament object:", tournament);
        console.log("Tournament ID:", tournament?.id);
        return <BracketPage 
          teams={teams}
          setTeams={setTeams}
          tournament={tournament}
          setTournament={setTournament}
          generateBracket={handleGenerateBracket}
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
                      disabled={loading}
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                        loading 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </label>
                    {currentTeam.logo && (
                      <div className="relative">
                        <img 
                          src={currentTeam.logo} 
                          alt="Logo preview" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                        />
                        {loading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
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