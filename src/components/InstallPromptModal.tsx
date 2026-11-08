import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, SquarePlus, Smartphone, ArrowRight, X } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'>;
  isIOS: boolean;
  canPromptDirectly: boolean;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  canPromptDirectly,
}) => {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await onInstall();
      if (result === 'accepted') {
        onClose();
      } else if (result === 'ios' || (!canPromptDirectly && isIOS)) {
        setShowIOSGuide(true);
      } else if (result === 'unavailable') {
        setShowIOSGuide(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleClose = () => {
    setShowIOSGuide(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-card rounded-[32px] p-6 sm:p-8 text-center space-y-6 shadow-2xl border border-white/20 bg-background/95 animate-in zoom-in-95 duration-300 relative">
        {/* Close button in corner */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {!showIOSGuide ? (
          <>
            {/* Logo sem o ícone de estrela */}
            <div className="mx-auto w-24 h-24 rounded-2xl bg-white p-3 shadow-xl border border-border/40 flex items-center justify-center">
              <img src="/lume-logo.png" alt="LUMEfit" className="w-full h-full object-contain" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                onClick={handleInstallClick}
                disabled={installing}
                className="h-13 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-base shadow-lg shadow-brand-accent-2/25 transition-all active:scale-[0.98]"
              >
                {installing ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Instalar App no Ecrã"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleClose}
                className="h-11 rounded-xl text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
              >
                Continuar sem instalar
              </Button>
            </div>
          </>
        ) : (
          /* iOS Safari Step-by-Step Guide */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-accent-2/10 text-brand-accent-2 flex items-center justify-center">
              <Smartphone className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Como instalar no iPhone / iPad
              </h3>
              <p className="text-xs text-muted-foreground">
                Siga estes 2 passos simples no Safari:
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="w-8 h-8 rounded-xl bg-brand-accent-2 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  1
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    Toca em Partilhar <Share className="w-3.5 h-3.5 text-brand-accent-2 inline" />
                  </p>
                  <p className="text-muted-foreground">
                    Na barra inferior do Safari, clica no ícone de partilha.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="w-8 h-8 rounded-xl bg-brand-accent-2 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  2
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    "Adicionar ao Ecrã Principal" <SquarePlus className="w-3.5 h-3.5 text-brand-accent-2 inline" />
                  </p>
                  <p className="text-muted-foreground">
                    Rola a lista para baixo e seleciona "Adicionar ao Ecrã Principal", depois clica em "Adicionar".
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-sm shadow-md shadow-brand-accent-2/20"
            >
              <span className="flex items-center justify-center gap-2">
                Concluir e Entrar no App <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
