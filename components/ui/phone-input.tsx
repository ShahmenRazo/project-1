"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AsYouType, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PHONE_COUNTRIES: { iso: CountryCode; label: string; dial: string }[] = [
  { iso: "US", label: "US", dial: "+1" },
  { iso: "CA", label: "Canada", dial: "+1" },
  { iso: "GB", label: "UK", dial: "+44" },
  { iso: "AU", label: "Australia", dial: "+61" },
  { iso: "DE", label: "Germany", dial: "+49" },
  { iso: "FR", label: "France", dial: "+33" },
  { iso: "ES", label: "Spain", dial: "+34" },
  { iso: "IT", label: "Italy", dial: "+39" },
  { iso: "MX", label: "Mexico", dial: "+52" },
  { iso: "BR", label: "Brazil", dial: "+55" },
  { iso: "IN", label: "India", dial: "+91" },
  { iso: "PL", label: "Poland", dial: "+48" },
  { iso: "RU", label: "Russia", dial: "+7" },
  { iso: "UA", label: "Ukraine", dial: "+380" },
];

interface PhoneInputProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Вызывается при каждом изменении: (valid, e164) */
  onParsed: (valid: boolean, e164: string | null) => void;
  defaultRegion?: CountryCode;
  autoFocus?: boolean;
}

/** Поле телефона: селектор страны (+1 по умолчанию), маска (999) 999-9999,
 *  нормализация в E.164 через libphonenumber-js. */
export function PhoneInput({
  id,
  value,
  onValueChange,
  onParsed,
  defaultRegion = "US",
  autoFocus,
}: PhoneInputProps) {
  const [region, setRegion] = useState<CountryCode>(defaultRegion);

  const emitParsed = (display: string, nextRegion: CountryCode) => {
    const parsed = parsePhoneNumberFromString(display, nextRegion);
    onParsed(
      Boolean(parsed && parsed.isValid()),
      parsed && parsed.isValid() ? parsed.format("E.164") : null
    );
  };

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    const next = new AsYouType(region).input(digits);
    onValueChange(next);
    emitParsed(next, region);
  };

  const handleRegionChange = (iso: string) => {
    const next = iso as CountryCode;
    const digits = value.replace(/[^\d]/g, "");
    const formatted = new AsYouType(next).input(digits);
    setRegion(next);
    onValueChange(formatted);
    emitParsed(formatted, next);
  };

  return (
    <div className="flex gap-2">
      <Select value={region} onValueChange={handleRegionChange}>
        <SelectTrigger id={id ? `${id}-region` : undefined} className="h-10 w-[110px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PHONE_COUNTRIES.map((c) => (
            <SelectItem key={c.iso} value={c.iso}>
              <span className="inline-flex w-full items-center justify-between gap-4">
                <span>{c.label}</span>
                <span className="text-muted-foreground">{c.dial}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          {PHONE_COUNTRIES.find((c) => c.iso === region)?.dial}
        </span>
        <Input
          id={id}
          inputMode="tel"
          placeholder="(999) 999-9999"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus={autoFocus}
          className={cn(
            "h-10 pl-12 pr-9",
            value &&
              parsePhoneNumberFromString(value, region)?.isValid() &&
              "border-emerald-500/60 focus-visible:ring-emerald-500/30"
          )}
        />
        {value && parsePhoneNumberFromString(value, region)?.isValid() && (
          <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        )}
      </div>
    </div>
  );
}