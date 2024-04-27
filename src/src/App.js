import './App.css';
import Create from './pages/Create';
import Edit from './pages/Edit';
import Home from './pages/Home';
import MainPage from './pages/MainPage';
import Translate from './pages/Translate';
import { Routes, Route } from "react-router-dom";

export default function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/home" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/edit" element={<Edit />} />
                <Route path="/translate" element={<Translate />} />
            </Routes>
        </div>
    );
}
