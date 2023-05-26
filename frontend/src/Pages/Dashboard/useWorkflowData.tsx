import { useEffect, useState } from "react";

function useWorkflowData() {
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3100/workflow_runs")
      .then(response => response.json())
      .then(json => {
        console.log("Fetched workflow data:", json); // Debugging statement
        setWorkflowData(json);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log("Workflow data:", workflowData); // Debugging statement
  return {workflowData, loading};
}

export default useWorkflowData
