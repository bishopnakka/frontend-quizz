import React, { useEffect, useState, useCallback } from "react";
import "./Design.css";

//code changed for questions lock
const randomRGB = () =>
  `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(
    Math.random() * 200
  )}, ${Math.floor(Math.random() * 200)})`;

const Design1 = ({ questions = [] }) => {
  const userName = localStorage.getItem("name") || "User";

  const [selected, setSelected] = useState({});        // { questionId: option }
  const [score, setScore] = useState(0);
  const [colors, setColors] = useState({});
  const [answeredIds, setAnsweredIds] = useState([]); // 🔥 KEY FIX

  /* 🎨 Generate colors (stable per question list) */
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = randomRGB();
    });
    setColors(temp);
  }, [questions]);

  /* ✅ Fetch previous score + answered questions */
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
          setScore(data.score || 0);
          setAnsweredIds(data.answeredQuestions || []);
        }
      } catch {
        console.log("No previous attempt");
      }
    };

    fetchScore();
  }, []);

  /* 🔓 Logout */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  /* ✅ Save score with answered question IDs */
  const saveScore = useCallback(async (updatedAnsweredIds, updatedScore) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          score: updatedScore,
          total: questions.length,
          answeredQuestions: updatedAnsweredIds
        })
      });
    } catch (err) {
      console.error("Failed to save score");
    }
  }, [questions.length]);

  /* ✅ Handle answer click (PER QUESTION LOCK) */
  const handleClick = (id, option, correctAnswer) => {
    if (answeredIds.includes(id)) return; // 🔒 lock only answered ones

    setSelected(prev => ({ ...prev, [id]: option }));

    let newScore = score;
    if (option === correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    const updatedAnsweredIds = [...answeredIds, id];
    setAnsweredIds(updatedAnsweredIds);

    // save immediately
    saveScore(updatedAnsweredIds, newScore);
  };

  if (questions.length === 0) {
    return <h2>No questions found</h2>;
  }

  return (
    <div className="box">
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
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

      {questions.map((q, index) => {
        const isAnswered = answeredIds.includes(q._id);

        return (
          <div
            key={q._id}
            className="quizz"
            style={{ backgroundColor: colors[q._id] }}
          >
            <div className="questions">
              <h2>{index + 1}. {q.question}</h2>
            </div>

            <div className="answers">
              <ul>
                {q.options.map((opt, i) => {
                  let className = "";

                  if (isAnswered) {
                    if (opt === q.answer) className = "correct";
                    else if (opt === selected[q._id]) className = "wrong";
                  }

                  return (
                    <li
                      key={i}
                      className={className}
                      style={{
                        pointerEvents: isAnswered ? "none" : "auto",
                        opacity: isAnswered ? 0.7 : 1,
                        cursor: isAnswered ? "not-allowed" : "pointer"
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
        );
      })}
    </div>
  );
};

export default Design1;
