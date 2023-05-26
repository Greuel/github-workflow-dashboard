import { useEffect, useState } from "react";

function useProgressData() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3100/in_progress")
      .then(response => response.json())
      .then(json => {
        console.log("Fetched in_progress data:", json); // Debugging statement
        setProgressData(json);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log("ProgressData data:", progressData);
  const progressSize = progressData.length;
  return {progressData, loading, progressSize};
}

export default useProgressData
