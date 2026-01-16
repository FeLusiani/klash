import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { checkAndResetData } from './lib/versioning';

function App() {
  useEffect(() => {
    checkAndResetData().then((wasReset) => {
      if (wasReset) {
        console.log('App data was reset due to version update.');
      }
    });
  }, []);

  return <AppRoutes />;
}

export default App;

