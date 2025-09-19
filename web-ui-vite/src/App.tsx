import React from 'react'
import { CreateProfileForm } from './components/profile/CreateProfileForm'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Social Media Profile</h1>
      </header>

      <main className="app-main">
        <CreateProfileForm />
      </main>
    </div>
  )
}

export default App
