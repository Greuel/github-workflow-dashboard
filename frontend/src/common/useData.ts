import { useEffect, useState } from 'react';

export const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || `${location.protocol}://${location.hostname}${process.env.PUBLIC_URL}/api`;

function useData<T>(api: string) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const callApi = async () => {
    try {
      setLoading(true);
      const response = await fetch(api);
      const jsonData: T = await response.json();
      console.debug('Fetched data:', jsonData);
      setData(jsonData);
    } catch (error) {
      setError(error as Error);
      console.error('An error occurred while fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callApi();
  }, []);

  return { data, loading, error };
}

export default useData;
