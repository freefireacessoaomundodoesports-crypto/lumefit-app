import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, SquarePlus, Download, X, Check, MoreVertical } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'>;
  isIOS: boolean;
  isAndroid: boolean;
  canPromptDirectly: boolean;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  isAndroid,
  canPromptDirectly,
}) => {
  const [installing, setInstalling] = useState(false);
  const [showAndroidManualGuide, setShowAndroidManualGuide] = useState(false);

  if (!isOpen) return null;

  // On Android / Chromium: Click to install triggers automatic native installation prompt directly
  const handleAndroidInstall = async () => {
    setInstalling(true);
    try {
      const result = await onInstall();
      if (result === 'accepted' || result === 'dismissed') {
        onClose();
      } else if (result === 'unavailable' && !canPromptDirectly) {
        // Only if direct prompt couldn't be triggered on Android
        setShowAndroidManualGuide(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleClose = () => {
    setShowAndroidManualGuide(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-card rounded-[32px] p-6 sm:p-7 text-center space-y-5 shadow-2xl border border-white/20 bg-background/98 animate-in zoom-in-95 duration-300 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-white p-2.5 shadow-lg border border-border/40 flex items-center justify-center">
          <img src="/lume-logo.png" alt="LUMEfit" className="w-full h-full object-contain" />
        </div>

        {isIOS ? (
          /* ========================================================= */
          /* IPHONE / IOS: Instruções super fáceis e visuais             */
          /* ========================================================= */
          <div className="space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                Instalar no iPhone
              </h3>
              <p className="text-xs text-muted-foreground">
                Para ter o LUMEfit no seu ecrã como aplicativo, siga estes 2 passos no Safari:
              </p>
            </div>

            {/* Passos fáceis e visuais */}
            <div className="space-y-2.5 text-left">
              {/* Passo 1 */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border/50">
                <div className="w-9 h-9 rounded-xl bg-brand-accent-2 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  1
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                    Toca em Partilhar
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-accent-2/15 text-brand-accent-2">
                      <Share className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-muted-foreground leading-snug">
                    Na barra inferior do Safari, clica no botão de partilha.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border/50">
                <div className="w-9 h-9 rounded-xl bg-brand-accent-2 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  2
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <p className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                    "Adicionar ao Ecrã"
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-accent-2/15 text-brand-accent-2">
                      <SquarePlus className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-muted-foreground leading-snug">
                    Rola a lista para baixo, escolhe <strong className="text-foreground font-semibold">Adicionar ao Ecrã Principal</strong> e confirma em <strong className="text-foreground font-semibold">Adicionar</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Dica amigável */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 border border-emerald-500/20">
              <Check className="w-4 h-4 shrink-0" />
              <span>O app LUMEfit vai aparecer no teu ecrã inicial!</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={handleClose}
                className="w-full h-12 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-sm shadow-md shadow-brand-accent-2/20"
              >
                Entendido, vou adicionar
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="h-10 rounded-xl text-muted-foreground hover:text-foreground font-medium text-xs"
              >
                Continuar no navegador
              </Button>
            </div>
          </div>
        ) : showAndroidManualGuide ? (
          /* ========================================================= */
          /* CASO RARO NO ANDROID: Se o prompt direto não abriu        */
          /* ========================================================= */
          <div className="space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Instalar no Android
              </h3>
              <p className="text-xs text-muted-foreground">
                Para adicionar ao teu ecrã inicial:
              </p>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border/50 text-left">
              <div className="w-9 h-9 rounded-xl bg-brand-accent-2 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                <MoreVertical className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5 flex-1">
                <p className="font-bold text-foreground">
                  Menu do Navegador (3 pontinhos)
                </p>
                <p className="text-muted-foreground leading-snug">
                  Clica nos 3 pontinhos no canto superior e seleciona <strong className="text-foreground">"Instalar aplicação"</strong> ou <strong className="text-foreground">"Adicionar ao ecrã inicial"</strong>.
                </p>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-sm shadow-md"
            >
              Entendido
            </Button>
          </div>
        ) : (
          /* ========================================================= */
          /* ANDROID (E OUTROS): Instalação automática sem instruções!  */
          /* ========================================================= */
          <div className="space-y-4 text-center">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Instalar o LUMEfit
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instala a aplicação no teu telemóvel para ter acesso rápido, direto e usar sem complicações.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                onClick={handleAndroidInstall}
                disabled={installing}
                className="w-full h-13 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-base shadow-lg shadow-brand-accent-2/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {installing ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Instalar Agora</span>
                  </>
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
          </div>
        )}
      </div>
    </div>
  );
};
