import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminPanel = ({ questions, setQuestions }) => {
  const navigate = useNavigate();

  // 🔐 AUTH CHECK
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 🚫 Block non-admin
  useEffect(() => {
    if (!token || role !== "ADMIN") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  // ================= QUESTION FORM =================
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
    // setQuestions([...questions, newQuestion]);
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
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setQuestions(questions.filter(q => q._id !== id));
  };

  // ================= SCORE DASHBOARD =================
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/scores`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setScores(data))
      .catch(err => console.error(err));
  }, [token]);

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Panel</h1>
      <button onClick={logout}>Logout</button>

      {/* ================= ADD QUESTION ================= */}
      <h2>Add Question</h2>

      <input
        placeholder="Question"
        value={form.question}
        onChange={e => setForm({ ...form, question: e.target.value })}
      />

      {form.options.map((opt, i) => (
        <input
          key={i}
          placeholder={`Option ${i + 1}`}
          value={opt}
          onChange={e => handleOptionChange(i, e.target.value)}
        />
      ))}

      <input
        placeholder="Correct Answer"
        value={form.answer}
        onChange={e => setForm({ ...form, answer: e.target.value })}
      />

      <br /><br />
      <button onClick={addQuestion}>Add Question</button>

      <hr />

      {/* ================= QUESTIONS ================= */}
      <h2>All Questions</h2>
      {questions.map(q => (
        <div key={q._id}>
          <b>{q.question}</b>
          <button onClick={() => deleteQuestion(q._id)}>Delete</button>
        </div>
      ))}

      <hr />

      {/* ================= USER SCORES ================= */}
      <h2>User Scores</h2>

      <table border="1" cellPadding="8">
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
              <td>{new Date(s.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
