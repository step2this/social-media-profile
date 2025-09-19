import React, { useState } from 'react'
import { ProfileForm } from './components/ProfileForm'
import { ProfileDisplay } from './components/ProfileDisplay'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const handleProfileCreated = (profile: any) => {
    setCurrentUserId(profile.userId)
    setCurrentView('view')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Social Media Profile</h1>
        <nav>
          <button
            onClick={() => setCurrentView('create')}
            className={currentView === 'create' ? 'active' : ''}
          >
            Create Profile
          </button>
          {currentUserId && (
            <button
              onClick={() => setCurrentView('view')}
              className={currentView === 'view' ? 'active' : ''}
            >
              View Profile
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'create' && (
          <ProfileForm
            mode="create"
            onSuccess={handleProfileCreated}
          />
        )}

        {currentView === 'view' && currentUserId && (
          <ProfileDisplay
            userId={currentUserId}
            allowEdit={true}
          />
        )}
      </main>
    </div>
  )
}

export default App
