"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Plus, X, Upload, Save,  Trash2, Play } from 'lucide-react';


type Team = {
  id: number;
  name: string;
  logo: string | null;
  players: string[];
  wins: number;
  losses: number;
  points: number;
};


export const TournamentSection = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [currentTeam, setCurrentTeam] = useState({
    name: '',
    logo: null,
    players: ['', '', '', '','']
  });

  // Sample initial teams for demo
  useEffect(() => {
    const sampleTeams = [
      { 
        id: 1, 
        name: 'Team Alpha', 
        logo: null, 
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        wins: 8,
        losses: 2,
        points: 26
      },
      { 
        id: 2, 
        name: 'Team Beta', 
        logo: null, 
        players: ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD'],
        wins: 7,
        losses: 3,
        points: 24
      }
    ];
    setTeams(sampleTeams);
  }, []);

  const handleCreateTeam = () => {
    if (currentTeam.name && currentTeam.players.some(p => p.trim())) {
      const newTeam = {
        id: Date.now(),
        name: currentTeam.name,
        logo: currentTeam.logo,
        players: currentTeam.players.filter(p => p.trim()),
        wins: 0,
        losses: 0,
        points: 0
      };
      
      setTeams([...teams, newTeam]);
      setCurrentTeam({ name: '', logo: null, players: ['', '', '', ''] });
      setShowCreateModal(false);
      
      // In a real app, you'd save to Firebase here
      console.log('Team created:', newTeam);
    }
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...currentTeam.players];
    newPlayers[index] = value;
    setCurrentTeam({ ...currentTeam, players: newPlayers });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
            setCurrentTeam({ ...currentTeam, logo: e.target?.result });
          };
          reader.readAsDataURL(file);
        };

  const deleteTeam = (teamId: number) => {
    setTeams(teams.filter(team => team.id !== teamId));
  };

  const generateBracket = () => {
    if (teams.length < 2) {
      alert('Need at least 2 teams to generate bracket');
      return;
    }

    // Create tournament bracket
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    const bracket = {
      id: Date.now(),
      teams: shuffledTeams,
      rounds: generateRounds(shuffledTeams),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setTournament(bracket);
    setShowBracket(true);
  };

  const generateRounds = (teamList: Team[]) => {
    const rounds = [];
    let currentRound = [];
    
    // Generate first round matches
    for (let i = 0; i < teamList.length; i += 2) {
      if (i + 1 < teamList.length) {
        currentRound.push({
          id: `match-${i/2}`,
          team1: teamList[i],
          team2: teamList[i + 1],
          winner: null,
          score1: 0,
          score2: 0,
          status: 'pending'
        });
      }
    }
    
    rounds.push(currentRound);
    
    // Generate subsequent rounds
    while (currentRound.length > 1) {
      const nextRound = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        if (i + 1 < currentRound.length) {
          nextRound.push({
            id: `match-${rounds.length}-${i/2}`,
            team1: null,
            team2: null,
            winner: null,
            score1: 0,
            score2: 0,
            status: 'pending'
          });
        }
      }
      if (nextRound.length > 0) {
        rounds.push(nextRound);
        currentRound = nextRound;
      } else {
        break;
      }
    }
    
    return rounds;
  };

  const features = [
    { 
      title: "Automated Brackets", 
      description: "Smart bracket generation with real-time updates",
      icon: <Trophy className="w-6 h-6" />
    },
    { 
      title: "Live Scoring", 
      description: "Real-time match results and leaderboards",
      icon: <Play className="w-6 h-6" />
    },
    { 
      title: "Team Management", 
      description: "Create and manage teams with player rosters",
      icon: <Users className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Tournament System</h2>
            <p className="text-gray-300 text-lg">Create teams, manage tournaments, and track results</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Tournament System Overview */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gray-800 border border-green-400/20 rounded-xl p-8 hover:border-green-400 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-400">Tournament System</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Create teams, organize tournaments, and track results in real-time. 
                Automated bracket generation with team management capabilities.
              </p>
              <div className="space-y-4">
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-green-500 transition-all duration-300 mr-4"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create Team
                </motion.button>
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateBracket}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300"
                >
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Generate Bracket
                </motion.button>
              </div>
            </motion.div>
            
            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-800 border border-green-400/20 rounded-xl p-6 hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-400/20 p-3 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2 text-green-400">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Teams Display */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Registered Teams ({teams.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-700 p-6 rounded-xl hover:bg-gray-600 transition-all duration-300 border border-green-400/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-black" />
                        )}
                      </div>
                      <h4 className="text-xl font-bold text-white">{team.name}</h4>
                    </div>
                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300 font-semibold">Players:</p>
                    {team.players.map((player, index) => (
                      <p key={index} className="text-green-400 text-sm">• {player}</p>
                    ))}
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

          {/* Bracket Display */}
          {tournament && showBracket && (
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Tournament Bracket</h3>
              <div className="space-y-8">
                {tournament.rounds.map((round, roundIndex) => (
                  <div key={roundIndex} className="space-y-4">
                    <h4 className="text-xl font-semibold text-green-400">
                      {roundIndex === tournament.rounds.length - 1 ? 'Final' : `Round ${roundIndex + 1}`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.map((match) => (
                        <div key={match.id} className="bg-gray-700 p-4 rounded-lg border border-green-400/20">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">
                                {match.team1 ? match.team1.name : 'TBD'}
                              </span>
                              <span className="text-green-400">{match.score1}</span>
                            </div>
                            <div className="text-center text-gray-400 text-sm">VS</div>
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">
                                {match.team2 ? match.team2.name : 'TBD'}
                              </span>
                              <span className="text-green-400">{match.score2}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
              className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Create Team</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                    onClick={handleCreateTeam}
                    className="flex-1 bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Create Team
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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