'use client';
import { useI18n } from '@/context/I18nContext';

export default function Footer() {
    return <FooterContent />;
  }
  
  function FooterContent() {
    const { t } = useI18n();
    
    return (
      <footer className="bg-transparent border-t border-gray-200 p-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
          {t('footer.copyright')}
        </div>
      </footer>
    );
  }
  