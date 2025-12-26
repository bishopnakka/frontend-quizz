import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Design1 from "./components/Design1";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/questions`
        );

        if (!res.ok) throw new Error("Failed to fetch questions");

        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Question fetch error:", err);
        setQuestions([]); // ✅ prevent infinite loading
      } finally {
        setLoading(false); // ✅ ALWAYS stop loading
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "40px" }}>
        Loading questions...
      </h2>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
