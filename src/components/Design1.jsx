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

  // Color stability
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      if (!colors[q._id]) {
        temp[q._id] = randomRGB();
      } else {
        temp[q._id] = colors[q._id];
      }
    });
    setColors(temp);
  }, [questions]);

  // Load score from Backend
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
      } catch (err) {
        console.log("No previous score found");
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const saveScore = useCallback(async (updatedScore) => {
    await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        score: updatedScore,
        total: questions.length
      })
    });
  }, [questions.length]);

  const handleClick = (id, option, correctAnswer, index) => {
    if (index < attemptedCount || selected[id]) return;

    const updatedSelected = { ...selected, [id]: option };
    setSelected(updatedSelected);

    let updatedScore = score;
    if (option === correctAnswer) {
      updatedScore = score + 1;
      setScore(updatedScore);
    }

    if (Object.keys(updatedSelected).length + attemptedCount === questions.length) {
      saveScore(updatedScore);
      setAttemptedCount(questions.length);
    }
  };

  if (loading) return <h2>Loading quiz...</h2>;
  if (!questions.length) return <h2>No Questions Available</h2>;

  return (
    <div className="box">
      <div className="top-bar">
        <h2>Welcome, <span style={{ color: "green" }}>{userName}</span></h2>
        <button className="logoutbtn" onClick={handleLogout}>Logout</button>
      </div>

      <h1 className="score">Score: {score} / {questions.length}</h1>

      {questions.map((q, index) => {
        const isLocked = index < attemptedCount;

        return (
          <div key={q._id} className="quizz" style={{ backgroundColor: colors[q._id] }}>
            <h2>{index + 1}. {q.question}</h2>
            <ul>
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  onClick={() => handleClick(q._id, opt, q.answer, index)}
                  className={
                    selected[q._id]
                      ? opt === q.answer
                        ? "correct"
                        : opt === selected[q._id]
                        ? "wrong"
                        : ""
                      : ""
                  }
                  style={{
                    pointerEvents: isLocked ? "none" : "auto",
                    opacity: isLocked ? 0.6 : 1,
                    cursor: isLocked ? "not-allowed" : "pointer"
                  }}
                >
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default Design1;
