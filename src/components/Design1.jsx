import React, { useEffect, useState, useCallback } from "react";
import "./Design.css";

const randomRGB = () =>
  `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(
    Math.random() * 200
  )}, ${Math.floor(Math.random() * 200)})`;

const Design1 = ({ questions = [] }) => {
  const userName = localStorage.getItem("name") || "User";

  const [selected, setSelected] = useState({});
  const [score, setScore] = useState(0);
  const [colors, setColors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // 🎨 Generate colors once per question list
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = randomRGB();
    });
    setColors(temp);
  }, [questions]);

  // ✅ Fetch previous score from backend (source of truth)
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/scores/me`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        if (res.ok) {
          const data = await res.json();
          setScore(data.score);
          setSubmitted(true); // 🔒 lock quiz
        }
      } catch {
        console.log("No previous score");
      }
    };

    fetchScore();
  }, []);

  // 🔓 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  // ✅ Save score to backend
  const saveScore = useCallback(async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          score,
          total: questions.length
        })
      });
    } catch (err) {
      console.error("Failed to save score");
    }
  }, [score, questions.length]);

  // ✅ Handle answer click
  const handleClick = (id, option, correctAnswer) => {
    if (selected[id] || submitted) return;

    setSelected(prev => ({ ...prev, [id]: option }));

    if (option === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  // ✅ Submit score once
  useEffect(() => {
    if (
      Object.keys(selected).length === questions.length &&
      questions.length > 0 &&
      !submitted
    ) {
      saveScore();
      setSubmitted(true);
    }
  }, [selected, questions.length, submitted, saveScore]);

  if (questions.length === 0) {
    return <h2>No questions found</h2>;
  }

  return (
    <div className="box">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h2>
          Welcome, <span style={{ color: "green" }}>{userName}</span>
        </h2>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <h1 className="score">
        Score: {score} / {questions.length}
      </h1>

      {questions.map((q, index) => (
        <div
          key={q._id}
          className="quizz"
          style={{ backgroundColor: colors[q._id] }}
        >
          <div className="questions">
            <h2>
              {index + 1}. {q.question}
            </h2>
          </div>

          <div className="answers">
            <ul>
              {q.options.map((opt, i) => {
                let className = "";

                if (selected[q._id]) {
                  if (opt === q.answer) className = "correct";
                  else if (opt === selected[q._id]) className = "wrong";
                }

                return (
                  <li
                    key={i}
                    className={className}
                    style={{
                      pointerEvents:
                        selected[q._id] || submitted ? "none" : "auto",
                      opacity:
                        selected[q._id] || submitted ? 0.7 : 1,
                      cursor:
                        selected[q._id] || submitted
                          ? "not-allowed"
                          : "pointer"
                    }}
                    onClick={() =>
                      handleClick(q._id, opt, q.answer)
                    }
                  >
                    {i + 1}. {opt}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Design1;
