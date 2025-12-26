import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const AdminPanel = ({ questions, setQuestions }) => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!token || role !== "ADMIN") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    answer: ""
  });

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const addQuestion = async () => {
    if (!form.question || !form.answer) {
      alert("Fill all fields");
      return;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    const newQuestion = await res.json();
    setQuestions([newQuestion, ...questions]);

    setForm({
      question: "",
      options: ["", "", "", ""],
      answer: ""
    });
  };

  const deleteQuestion = async (id) => {
    await fetch(`${process.env.REACT_APP_API_URL}/questions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setQuestions(questions.filter(q => q._id !== id));
  };

  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/scores`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setScores(data))
      .catch(err => console.error(err));
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      {/* ADD QUESTION */}
      <div className="admin-card">
        <h2>Add Question</h2>

        <input
          className="admin-input"
          placeholder="Enter question"
          value={form.question}
          onChange={e => setForm({ ...form, question: e.target.value })}
        />

        {form.options.map((opt, i) => (
          <input
            key={i}
            className="admin-input"
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={e => handleOptionChange(i, e.target.value)}
          />
        ))}

        <input
          className="admin-input"
          placeholder="Correct answer"
          value={form.answer}
          onChange={e => setForm({ ...form, answer: e.target.value })}
        />

        <button className="add-btn" onClick={addQuestion}>
          Add Question
        </button>
      </div>

      {/* QUESTIONS LIST */}
      <div className="admin-card">
        <h2>All Questions</h2>

        {questions.map(q => (
          <div className="question-box" key={q._id}>
            <span>{q.question}</span>
            <button className="delete-btn" onClick={() => deleteQuestion(q._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* USER SCORES */}
      <div className="admin-card">
        <h2>User Scores</h2>

        <table className="score-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Score</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i}>
                <td>{s.userName}</td>
                <td>{s.score}</td>
                <td>{s.total}</td>
                <td>{new Date(s.createdAt || s.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
