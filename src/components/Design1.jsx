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
  const [loading, setLoading] = useState(true);

  /* 🎨 OLD COLOR LOGIC (UNCHANGED) */
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = randomRGB();
    });
    setColors(temp);
  }, [questions]);

  /* ✅ FETCH SCORE FROM BACKEND (SOURCE OF TRUTH) */
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
        setSubmitted(true); // lock quiz
      }
      // 👇 IMPORTANT: if 404, DO NOTHING (new user)
    } catch (err) {
      console.log("No previous score (new user)");
    }
  };

  fetchScore();
}, []);


  /* 🔓 LOGOUT (OLD STYLE SAFE) */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  /* ✅ SAVE SCORE (BACKEND UPSERT HANDLES DUPLICATES) */
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

  /* ✅ OLD CLICK LOGIC (UNCHANGED UI) */
  const handleClick = (id, option, correctAnswer) => {
    if (selected[id] || submitted) return;

    setSelected(prev => ({ ...prev, [id]: option }));

    if (option === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  /* ✅ AUTO SUBMIT ONCE */
  useEffect(() => {
    if (
      !loading &&
      Object.keys(selected).length === questions.length &&
      questions.length > 0 &&
      !submitted
    ) {
      saveScore();
      setSubmitted(true);
    }
  }, [selected, questions.length, submitted, saveScore, loading]);

  /* ⏳ LOADING (OLD SIMPLE TEXT) */
  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  if (questions.length === 0) {
    return <h2>No questions found</h2>;
  }

  return (
    <div className="box">
      <h2 style={{ textAlign: "center" }}>
        Welcome, <span style={{ color: "green" }}>{userName}</span>
      </h2>

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
            <h2>{index + 1}. {q.question}</h2>
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
                        selected[q._id] || submitted
                          ? "none"
                          : "auto",
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

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Design1;
