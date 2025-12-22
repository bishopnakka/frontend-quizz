import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Design1 from "./components/Design1";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Auth info from localStorage
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch questions
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/questions`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading questions...</h2>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* REGISTER */}
        <Route path="/register" element={<Register />} />

        {/* QUIZ (Protected) */}
        <Route
          path="/"
          element={
            token ? (
              <Design1 questions={questions} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ADMIN (Protected + Role Based) */}
        <Route
          path="/admin"
          element={
            token && role === "ADMIN" ? (
              <AdminPanel
                questions={questions}
                setQuestions={setQuestions}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
