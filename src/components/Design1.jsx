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

  // 🎨 Stable colors
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = temp[q._id] || randomRGB();
    });
    setColors(temp);
  }, [questions]);

  // 🔍 Load score from DB
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
          setAttemptedCount(data.total);
        }
      } catch (error) {
        console.log("No previous score found");
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, []);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // 💾 Save Score
  const saveScore = useCallback(async (finalScore) => {
    await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        score: finalScore,
        total: questions.length
      })
    });
  }, [questions.length]);

  // 🎯 Answer Click Handler
  const handleClick = (id, option, correctAnswer, index) => {
    if (index < attemptedCount || selected[id]) return;

    const newSelected = { ...selected, [id]: option };
    setSelected(newSelected);

    let newScore = score;
    if (option === correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    if (Object.keys(newSelected).length + attemptedCount === questions.length) {
      saveScore(newScore);
      setAttemptedCount(questions.length);
    }
  };

  if (loading) return <h2>Loading quiz...</h2>;
  if (!questions.length) return <h2>No Questions Available</h2>;

  return (
    <div className="box">
      {/* Header */}
      <div className="top-bar">
        <h2>Welcome, <span style={{ color: "green" }}>{userName}</span></h2>
        <button className="logoutbtn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Score View */}
      <h1 className="score">Score: {score} / {questions.length}</h1>

      {/* QUESTIONS */}
      {questions.map((q, index) => (
        <div key={q._id} className="quizz" style={{ backgroundColor: colors[q._id] }}>
          <h2>{index + 1}. {q.question}</h2>

          <ul>
            {q.options.map((opt, i) => {
              const isLocked = index < attemptedCount;
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
                    pointerEvents: isLocked ? "none" : "auto",
                    opacity: isLocked ? 0.6 : 1
                  }}
                  onClick={() => handleClick(q._id, opt, q.answer, index)}
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
