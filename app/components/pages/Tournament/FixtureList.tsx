import React from "react";
import { Team } from "../../../services/teamservice";
import FixtureMatchCard from "./FixtureMatchCard";

interface Fixture {
  week: number;
  round: number;
  match: number;
  home: Team;
  away: Team;
}

interface FixtureListProps {
  fixtures: Fixture[];
  fixtureScores: { [key: string]: { homeScore: number; awayScore: number; completed?: boolean } };
  isSaving: boolean;
  getFixtureKey: (fx: Fixture) => string;
  getScore: (fixtureKey: string) => { homeScore: number | ""; awayScore: number | "" };
  handleScoreChange: (fixtureKey: string, side: "home" | "away", value: number) => void;
  handleSaveScore: (fixtureKey: string) => void;
}

const FixtureList: React.FC<FixtureListProps> = ({
  fixtures,
  fixtureScores,
  isSaving,
  getFixtureKey,
  getScore,
  handleScoreChange,
  handleSaveScore,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {fixtures.map(fixture => {
      const fixtureKey = getFixtureKey(fixture);
      const score = getScore(fixtureKey);
      const isCompleted = fixtureScores[fixtureKey]?.completed || false;
      return (
        <FixtureMatchCard
          key={fixtureKey}
          fixture={fixture}
          fixtureKey={fixtureKey}
          score={score}
          isCompleted={isCompleted}
          isSaving={isSaving}
          onScoreChange={(side, value) => handleScoreChange(fixtureKey, side, value)}
          onSave={() => handleSaveScore(fixtureKey)}
        />
      );
    })}
  </div>
);

export default FixtureList;