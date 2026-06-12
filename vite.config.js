import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,        // npm run dev — открыть браузер автоматически
    host: 'localhost', // доступ только с этого ПК (не пускаем в сеть)
  },
  preview: {
    open: true,        // npm run preview — открыть собранную версию
    host: 'localhost',
  },
})
