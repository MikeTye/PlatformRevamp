import './index.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initAnalytics } from './lib/analytics';

const container = document.getElementById('root');

if (container) {
    initAnalytics();

    const root = createRoot(container);
    root.render(<App />);
}