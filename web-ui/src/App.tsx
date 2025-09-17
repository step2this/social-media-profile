import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import { HomePage } from '@/pages/HomePage';
import { CreateProfilePage } from '@/pages/CreateProfilePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { FeedPage } from '@/pages/FeedPage';
import { DiscoveryPage } from '@/pages/DiscoveryPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  console.log('App with Router rendered at:', new Date().toISOString());

  try {
    return (
      <UserProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create-profile" element={<CreateProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/discover" element={<DiscoveryPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    );
  } catch (error) {
    console.error('Router error:', error);
    return (
      <div style={{padding: '20px', color: 'red'}}>
        <h3>Router Error</h3>
        <p>{String(error)}</p>
      </div>
    );
  }
}

export default App;