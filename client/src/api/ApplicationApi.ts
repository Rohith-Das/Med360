

const Application_BASE_URL = import.meta.env.VITE_API_BASE_URL_APP || 'http://localhost:5001/api';
export const API_ENDPOINTS = {
  SPECIALIZATIONS: `${Application_BASE_URL}/application/specializations`,
  SUBMIT_APPLICATION: `${Application_BASE_URL}/application/submit`,
};

export default Application_BASE_URL;


