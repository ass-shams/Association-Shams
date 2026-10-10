import { useState } from 'react';
import MembershipDocuments from './membership/MembershipDocuments';
import MembershipForm from './membership/MembershipForm';
import MembershipLanding from './membership/MembershipLanding';
import type { MembershipView } from './membership/types';

/**
 * Membership experience on the existing `/membership` route.
 *
 * The three views (landing, documents, form) are switched with local state,
 * so no new public route is introduced. The route configuration and the
 * backend-free architecture stay untouched.
 */
export default function MembershipPage() {
  const [view, setView] = useState<MembershipView>('landing');

  function goToLanding() {
    setView('landing');
  }

  if (view === 'documents') {
    return <MembershipDocuments onBack={goToLanding} />;
  }

  if (view === 'form') {
    return <MembershipForm onBack={goToLanding} />;
  }

  return (
    <MembershipLanding
      onOpenDocuments={() => setView('documents')}
      onOpenForm={() => setView('form')}
    />
  );
}
