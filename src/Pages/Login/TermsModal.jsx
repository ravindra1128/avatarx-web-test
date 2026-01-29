import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../Component/UI/dialog";
import { useTranslation } from "react-i18next";
import { rawTermsHtml } from "../termsRaw";

export default function TermsModal({ isOpen, onClose, onComplete }) {
  const { t } = useTranslation();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} onPointerDownOutside={(e) => e.preventDefault()}>
      <DialogContent className="w-[95vw] max-w-4xl mx-auto p-0 bg-white rounded-2xl shadow-2xl border-0 overflow-hidden pt-9" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="relative">
          <div>
            <div
              className="w-full overflow-y-auto max-h-[75vh] sm:max-h-[75vh] 
                         prose prose-sm sm:prose-base max-w-none
                         text-gray-700 leading-relaxed
                         scrollbar-thin scrollbar-thumb-gray-300 scrollbar-transparent
                         hover:scrollbar-thumb-gray-400
                         rounded-lg border border-gray-200 p-3 sm:p-5
                         bg-gradient-to-b from-gray-50 to-white"
              dangerouslySetInnerHTML={{ __html: rawTermsHtml }}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollTop + clientHeight >= scrollHeight - 10) {
                  onComplete();
                }
              }}
            />
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Footer */}
        <div className="px-6 py-1 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            {t('login.termsModal.readCarefully')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
