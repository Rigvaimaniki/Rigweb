import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RequireAdmin } from './components/RequireAdmin';
import { RequireEmployeeAccess } from './components/RequireEmployeeAccess';
import { Home } from './pages/Home';
import { Param } from './pages/Param';
import { AI } from './pages/AI';
import { Defence } from './pages/Defence';
import { Passion } from './pages/Passion';
import { Careers } from './pages/Careers';
import { Contact } from './pages/Contact';
import { Access } from './pages/Access';
import { Admin } from './pages/Admin';
import { Employee } from './pages/Employee';
import { Register } from './pages/Register';

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/param" element={<Param />} />
          <Route path="/param/jodhpur" element={<Navigate to="/param" replace />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/defence" element={<Defence />} />
          <Route path="/passion" element={<Passion />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/access" element={<Access />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin"
            element={(
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            )}
          />
          <Route
            path="/employee"
            element={(
              <RequireEmployeeAccess>
                <Employee />
              </RequireEmployeeAccess>
            )}
          />
        </Routes>
      </main>
      <Footer 
        addressLine1="iStart Nest Incubation Center Gov. Polytechnic College ,"
        addressLine2="Jodhpur"
      />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
