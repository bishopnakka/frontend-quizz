import React, { useEffect, useState, useCallback } from "react";
import "./Design.css";

const randomRGB = () =>
  `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(
    Math.random() * 200
  )}, ${Math.floor(Math.random() * 200)})`;

const Design1 = ({ questions = [] }) => {
  const userName = localStorage.getItem("name") || "User";
  const userKey = `quiz_${userName}`;

  // 🔹 Restore saved state
  const savedSelected =
    JSON.parse(localStorage.getItem(`${userKey}_selected`)) || {};
  const savedScore =
    JSON.parse(localStorage.getItem(`${userKey}_score`)) || 0;

  const [selected, setSelected] = useState(savedSelected);
  const [score, setScore] = useState(savedScore);
  const [colors, setColors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // 🎨 Generate colors when questions change
  useEffect(() => {
    const temp = {};
    questions.forEach(q => {
      temp[q._id] = randomRGB();
    });
    setColors(temp);
  }, [questions]);

  // ✅ Save score to backend (STABLE)
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

  // ✅ Handle option click
  const handleClick = (id, option, correctAnswer) => {
    if (selected[id]) return;

    const updatedSelected = { ...selected, [id]: option };
    setSelected(updatedSelected);
    localStorage.setItem(
      `${userKey}_selected`,
      JSON.stringify(updatedSelected)
    );

    if (option === correctAnswer) {
      const newScore = score + 1;
      setScore(newScore);
      localStorage.setItem(
        `${userKey}_score`,
        JSON.stringify(newScore)
      );
    }
  };

  // ✅ Submit score ONCE after all questions answered
  useEffect(() => {
    const totalAnswered = Object.keys(selected).length;

    if (
      totalAnswered === questions.length &&
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
                      pointerEvents: selected[q._id] ? "none" : "auto",
                      opacity: selected[q._id] ? 0.7 : 1,
                      cursor: selected[q._id]
                        ? "not-allowed"
                        : "pointer"
                    }}
                    onClick={() =>
                      !selected[q._id] &&
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
