import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import BugsnagPerformance from '@bugsnag/browser-performance';

const apiKey = import.meta.env.VITE_BUGSNAG_API_KEY;

if (apiKey) {
  Bugsnag.start({
    apiKey,
    plugins: [new BugsnagPluginReact()],
    releaseStage: import.meta.env.VITE_ENV,
    enabledReleaseStages: ['development', 'testing', 'staging', 'production'],
  });

  BugsnagPerformance.start({
    apiKey,
  });
}

export default Bugsnag;
