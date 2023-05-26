import { useEffect, useState } from "react";

function useQueueData() {
  const [queueData, setQueueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3100/queue")
      .then(response => response.json())
      .then(json => {
        console.log("Fetched queue data:", json); // Debugging statement
        setQueueData(json);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log("Queue data:", queueData); // Debugging statement
  const queueSize = queueData.length;
  return {queueData,loading, queueSize};
}

export default useQueueData
