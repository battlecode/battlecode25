import React from 'react'
import ReactDom from 'react-dom/client'
import { MainPage } from './pages/main-page'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './app-context'

import '../style.css'

const elem = document.getElementById('root')
const root = ReactDom.createRoot(elem!)
root.render(
    <BrowserRouter>
        <AppContextProvider>
            <MainPage />
        </AppContextProvider>
    </BrowserRouter>
)
