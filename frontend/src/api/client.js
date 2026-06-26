import axios from 'axios'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    withCredentials: true,
})

export const aiClient = axios.create({
    baseURL: import.meta.env.VITE_AI_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '',
    withCredentials: true,
})

export default client