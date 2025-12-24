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
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [colors, setColors] = useState({});
  const [loading, setLoading] = useState(true);

  /* 🎨 Stable colors */
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = temp[q._id] || randomRGB();
    });
    setColors(temp);
  }, [questions]);

  /* ✅ Load score from BACKEND (SOURCE OF TRUTH) */
  useEffect(() => {
    const loadScore = async () => {
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
          setAttemptedCount(data.total); // 🔥 KEY FIX
        }
      } catch {
        // first-time user → no score
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, []);

  /* 🔓 Logout */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ✅ Save / update score */
  const saveScore = useCallback(async (newScore) => {
    await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        score: newScore,
        total: questions.length
      })
    });
  }, [questions.length]);

  /* ✅ Click handler */
  const handleClick = (id, option, correctAnswer, index) => {
    // 🔒 lock only OLD questions
    if (index < attemptedCount || selected[id]) return;

    setSelected(prev => ({ ...prev, [id]: option }));

    if (option === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  /* ✅ Submit when ALL current questions answered */
  useEffect(() => {
    if (
      Object.keys(selected).length + attemptedCount === questions.length &&
      questions.length > 0
    ) {
      saveScore(score);
      setAttemptedCount(questions.length);
    }
  }, [selected, attemptedCount, questions.length, saveScore, score]);

  if (loading) return <h2>Loading quiz...</h2>;
  if (questions.length === 0) return <h2>No questions found</h2>;

  return (
    <div className="box">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>
          Welcome, <span style={{ color: "green" }}>{userName}</span>
        </h2>
        <button onClick={handleLogout}>Logout</button>
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
          <h2>{index + 1}. {q.question}</h2>

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
                      index < attemptedCount ? "none" : "auto",
                    opacity:
                      index < attemptedCount ? 0.6 : 1
                  }}
                  onClick={() =>
                    handleClick(q._id, opt, q.answer, index)
                  }
                >
                  {opt}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Design1;
