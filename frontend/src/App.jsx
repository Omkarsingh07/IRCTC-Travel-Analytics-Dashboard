import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;