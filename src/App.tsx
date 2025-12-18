import React from 'react';
import Header from './components/Header/Header';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <h1 style={{ padding: '40px', textAlign: 'center' }}>
          Welcome to Our Website
        </h1>
        <p style={{ textAlign: 'center' }}>
          Header is ready! Next, we'll create the Footer.
        </p>
      </main>
    </div>
  );
}

export default App;
