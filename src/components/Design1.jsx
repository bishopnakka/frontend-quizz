import React, { useEffect, useState, useCallback } from "react";

/* ---------- Inline Styles ---------- */
const styles = {
  container: {
    padding: "20px",
    background: "#f4f6f9",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  logoutBtn: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "4px",
    cursor: "pointer"
  },
  score: {
    marginBottom: "20px"
  },
  quizCard: {
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  option: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "4px",
    listStyle: "none",
    cursor: "pointer",
    background: "#fff",
    border: "1px solid #ccc"
  },
  correct: {
    background: "#2ecc71",
    color: "#fff"
  },
  wrong: {
    background: "#e74c3c",
    color: "#fff"
  }
};

/* ---------- Utility ---------- */
const randomRGB = () =>
  `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(
    Math.random() * 200
  )}, ${Math.floor(Math.random() * 200)})`;

/* ---------- Component ---------- */
const Design1 = ({ questions = [] }) => {
  const userName = localStorage.getItem("name") || "User";

  const [selected, setSelected] = useState({});
  const [score, setScore] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [colors, setColors] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------- Stable Colors ---------- */
  useEffect(() => {
    setColors(prev => {
      const temp = {};
      questions.forEach(q => {
        temp[q._id] = prev[q._id] || randomRGB();
      });
      return temp;
    });
  }, [questions]);

  /* ---------- Load Previous Score ---------- */
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
      } catch {
        console.log("No previous score");
      } finally {
        setLoading(false);
      }
    };
    loadScore();
  }, []);

  /* ---------- Save Score ---------- */
  const saveScore = useCallback(async (finalScore) => {
    if (
      typeof finalScore !== "number" ||
      finalScore < 0 ||
      finalScore > questions.length
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/scores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            score: finalScore,
            total: questions.length
          })
        }
      );

      const data = await res.json();
      if (!res.ok) console.error(data);
    } catch (err) {
      console.error("Save score failed", err);
    }
  }, [questions.length]);

  /* ---------- Handle Option Click ---------- */
  const handleClick = (id, option, correctAnswer, index) => {
    if (index < attemptedCount || selected[id]) return;

    setSelected(prev => {
      const updated = { ...prev, [id]: option };

      // Live score update
      if (option === correctAnswer) {
        setScore(s => s + 1);
      }

      const answered = Object.keys(updated).length + attemptedCount;

      // Final submit
      if (answered === questions.length) {
        const finalScore = Object.entries(updated).reduce((count, [qid, ans]) => {
          const q = questions.find(x => x._id === qid);
          return q && q.answer === ans ? count + 1 : count;
        }, score);

        saveScore(finalScore);
        setAttemptedCount(questions.length);
      }

      return updated;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ---------- UI ---------- */
  if (loading) return <h2>Loading quiz...</h2>;
  if (!questions.length) return <h2>No Questions Available</h2>;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2>
          Welcome, <span style={{ color: "green" }}>{userName}</span>
        </h2>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <h2 style={styles.score}>
        Score: {score} / {questions.length}
      </h2>

      {questions.map((q, index) => {
        const isLocked = index < attemptedCount;

        return (
          <div
            key={q._id}
            style={{
              ...styles.quizCard,
              background: colors[q._id],
              opacity: isLocked ? 0.6 : 1
            }}
          >
            <h3>
              {index + 1}. {q.question}
            </h3>

            <ul style={{ padding: 0 }}>
              {q.options.map((opt, i) => {
                const isCorrect = selected[q._id] && opt === q.answer;
                const isWrong = selected[q._id] && opt === selected[q._id] && opt !== q.answer;

                return (
                  <li
                    key={i}
                    onClick={() => handleClick(q._id, opt, q.answer, index)}
                    style={{
                      ...styles.option,
                      ...(isCorrect ? styles.correct : {}),
                      ...(isWrong ? styles.wrong : {}),
                      pointerEvents: isLocked ? "none" : "auto"
                    }}
                  >
                    {opt}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default Design1;
