import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Phone } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Moçambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
  { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
  { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Brasil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Cabo Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
  { name: "Guiné-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
  { name: "São Tomé e Príncipe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
  { name: "Timor-Leste", code: "TL", dialCode: "+670", flag: "🇹🇱" },
  { name: "África do Sul", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Reino Unido", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Estados Unidos", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Espanha", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "França", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Alemanha", code: "DE", dialCode: "+49", flag: "🇩🇪" },
];

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  required?: boolean;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = true,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar o país atual correspondente ao código selecionado
  const currentCountry = useMemo(() => {
    return (
      COUNTRIES.find((c) => c.dialCode === countryCode) ||
      COUNTRIES.find((c) => c.code === "MZ") ||
      COUNTRIES[0]
    );
  }, [countryCode]);

  // Lista filtrada de países na busca
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5 text-brand-accent-2" /> Número do WhatsApp
      </label>

      <div className="flex items-center gap-2">
        {/* Seletor de País com Dropdown e Pesquisa */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-14 px-3.5 rounded-2xl bg-muted/30 border border-transparent focus:border-brand-accent-2/40 flex items-center gap-2 font-medium text-sm transition-all hover:bg-muted/50 active:scale-[0.98]"
          >
            <span className="text-xl">{currentCountry.flag}</span>
            <span className="font-semibold text-foreground">{countryCode || currentCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-0.5" />
          </button>

          {isOpen && (
            <div className="absolute left-0 top-16 z-50 w-72 max-h-72 glass-card bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Campo de Busca */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar país ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/40 text-xs font-medium border-none outline-none focus:ring-1 focus:ring-brand-accent-2"
                  autoFocus
                />
              </div>

              {/* Lista de Países */}
              <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
                {filteredCountries.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Nenhum país encontrado
                  </div>
                ) : (
                  filteredCountries.map((country) => {
                    const isSelected = country.dialCode === countryCode;
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          onCountryCodeChange(country.dialCode);
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-brand-accent-2/15 text-brand-accent-2 font-bold"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-lg">{country.flag}</span>
                          <span className="truncate">{country.name}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-muted-foreground font-semibold">{country.dialCode}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-accent-2 ml-1" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input para o número de telefone */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value.replace(/[^\d\s-]/g, ""))}
          className="flex-1 h-14 rounded-2xl bg-muted/30 border-none px-5 focus:ring-2 focus:ring-brand-accent-2 transition-all outline-none font-medium text-base"
          placeholder="84 123 4567"
          required={required}
        />
      </div>

      {/* Nota Explicativa */}
      <p className="text-[11px] leading-relaxed text-muted-foreground/90 bg-brand-accent-2/5 p-2.5 rounded-xl border border-brand-accent-2/10">
        💡 <strong className="text-foreground">Nota:</strong> Coloque o seu número verdadeiro do WhatsApp para que a equipa do LUMEfit possa entrar em contacto quando houver atualizações ou mudanças importantes no serviço.
      </p>
    </div>
  );
}
