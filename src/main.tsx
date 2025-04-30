import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store'; // Import the store
import App from './App.tsx';
import 'react-datepicker/dist/react-datepicker.css'; // Import datepicker CSS
// import './index.css'; // Removed default CSS

// Import plugins to ensure they are registered
import './plugins/EmailLinkPlugin.tsx'; // This executes the registration code

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}> {/* Wrap App with Provider */}
      <App />
    </Provider>
  </StrictMode>,
);
