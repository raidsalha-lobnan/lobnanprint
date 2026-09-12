import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { enforceArabicNumeralsGlobally } from './utils/numberFormat';
import './index.css';

// تفعيل الحظر الصارم للأرقام الهندية واعتماد الأرقام العربية 0-9 بغض النظر عن الجهاز أو لغة المتصفح
enforceArabicNumeralsGlobally();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="حدث خطأ في واجهة البرنامج">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
