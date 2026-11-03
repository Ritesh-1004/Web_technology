import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import StatsCard from '../components/StatsCard';
import { getReportStats } from '../utils/storage';

const FEATURES = [
  {
    icon: '1',
    title: 'Photo Check',
    description: 'An image-recognition model checks that the photo shows garbage before a report can be submitted.'
  },
  {
    icon: '2',
    title: 'Exact GPS Location',
    description: 'Use your device GPS to save the precise latitude and longitude, or type a location manually.'
  },
  {
    icon: '3',
    title: 'Complaint Tracking',
    description: 'Every report gets a unique complaint ID that you can look up on the Track page.'
  },
  {
    icon: '4',
    title: 'Officer Dashboard',
    description: 'Officers can see each report, open its location on a map and update its status.'
  }
];

const STEPS = [
  { title: 'Take or upload a photo', description: 'Use your phone camera or choose an image from your gallery.' },
  { title: 'Photo is checked', description: 'Only a photo that shows garbage can be submitted.' },
  { title: 'Add location and details', description: 'Use GPS for the exact spot and describe the problem.' },
  { title: 'Submit your complaint', description: 'You get a unique complaint ID. No sign-up is needed.' },
  { title: 'Track the status', description: 'Look up your complaint with its ID at any time.' }
];

export default function Home() {
  // Real counts from the reports saved in this browser (0 if there are none)
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    setStats(getReportStats());
  }, []);

  return (
    <>
      <Hero />

      <section className="section container">
        <div className="section-head">
          <span className="section-eyebrow">Key Features</span>
          <h2>What the portal does</h2>
        </div>
        <div className="card-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section className="section container section-divided">
        <div className="section-head">
          <span className="section-eyebrow">How It Works</span>
          <h2>From spotting garbage to tracking the report</h2>
        </div>
        <div className="steps">
          {STEPS.map((step, i) => (
            <div className="step-item" key={step.title}>
              <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container section-divided">
        <div className="section-head">
          <span className="section-eyebrow">Report summary</span>
          <h2>Reports saved in this browser</h2>
        </div>
        <div className="card-grid">
          <StatsCard label="Total Reports" value={stats.total} />
          <StatsCard label="Pending" value={stats.pending} variant="pending" />
          <StatsCard label="In Progress" value={stats.inProgress} variant="progress" />
          <StatsCard label="Resolved" value={stats.resolved} variant="resolved" />
        </div>
      </section>
    </>
  );
}
