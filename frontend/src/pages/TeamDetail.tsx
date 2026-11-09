import React from 'react';
import { useParams } from 'react-router-dom';
import TeamRosterView from '../components/TeamRosterView';

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  return <TeamRosterView teamId={teamId ?? ''} />;
};

export default TeamDetail;
