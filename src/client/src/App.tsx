import { useState } from 'react'
import { GameBoard } from './components/GameBoard'

function App() {
  const [connected, setConnected] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">GMレスLoL風TRPG</h1>
        <div className="text-center mt-2">
          <span className={`inline-block px-3 py-1 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
            {connected ? '接続済み' : '未接続'}
          </span>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <GameBoard />
      </main>
    </div>
  )
}

export default App
