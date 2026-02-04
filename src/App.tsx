import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import TimerPage from "./routes/TimerPage";
import SettingsPage from "./routes/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/timer" replace />} />
      </Routes>
    </HashRouter>
  );
}
