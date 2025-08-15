import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
//QueryClient is cache/brain, QueryClientProvider shares it with app
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

//eauta QueryClient(brain jasto) banaune for whole app-like one central library catalog
const queryClient= new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* React query client ley wrap gardine, whole APP lai QueryClient(brain) ko access diney */}

    <QueryClientProvider client={queryClient}>
    <App />
     <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)

// Hamle app lai eauta brain jasto diyem jasle fetched data remember garxa ra within app share garxa,
//so every time same request pathaunu pardaina
