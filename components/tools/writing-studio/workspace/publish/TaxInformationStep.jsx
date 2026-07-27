"use client";

import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Shield,
  Globe,
  FileText,
  CheckCircle2,
  Info,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const US_COUNTRIES = ["US", "UM"];

const COUNTRIES = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" }, { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" }, { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" }, { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" }, { code: "CA", name: "Canada" },
  { code: "CN", name: "China" }, { code: "CO", name: "Colombia" },
  { code: "EG", name: "Egypt" }, { code: "ET", name: "Ethiopia" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" }, { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" }, { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" }, { code: "KE", name: "Kenya" },
  { code: "KR", name: "South Korea" }, { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" }, { code: "LY", name: "Libya" },
  { code: "MY", name: "Malaysia" }, { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" }, { code: "MM", name: "Myanmar" },
  { code: "NL", name: "Netherlands" }, { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" }, { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" }, { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" }, { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" },
  { code: "TN", name: "Tunisia" }, { code: "TR", name: "Turkey" },
  { code: "UG", name: "Uganda" }, { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" }, { code: "US", name: "United States" },
  { code: "UZ", name: "Uzbekistan" }, { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" }, { code: "ZW", name: "Zimbabwe" },
].sort((a, b) => a.name.localeCompare(b.name));

// Countries with US tax treaty (reduced withholding)
const TREATY_COUNTRIES = new Set([
  "AU", "AT", "BE", "BG", "CA", "CN", "CY", "CZ", "DK", "EG",
  "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IN", "ID", "IE",
  "IL", "IT", "JP", "KZ", "KR", "KG", "LV", "LT", "LU", "MT",
  "MX", "MD", "MA", "NL", "NZ", "NO", "PK", "PH", "PL", "PT",
  "RO", "RU", "SK", "SI", "ZA", "ES", "SE", "CH", "TJ", "TH",
  "TN", "TR", "TM", "UA", "GB", "UZ", "VN",
]);

const INPUT_CLASS =
  "w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all";

const SELECT_CLASS =
  "w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all appearance-none cursor-pointer";

function SelectWrapper({ children, ...props }) {
  return (
    <div className="relative">
      <select {...props}>{children}</select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
    </div>
  );
}

export function TaxInformationStep({ formData, updateFormData }) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id ?? user?.id ?? "";

  const existingTaxInfo = useQuery(api.publishing.getTaxInfo, { userId }, { enabled: !!userId });
  const saveTaxInfo = useMutation(api.publishing.saveTaxInfo);

  const [country, setCountry] = useState(formData.taxCountry ?? "");
  const [legalName, setLegalName] = useState(formData.taxLegalName ?? "");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState(formData.taxAddress ?? "");
  const [city, setCity] = useState(formData.taxCity ?? "");
  const [postalCode, setPostalCode] = useState(formData.taxPostalCode ?? "");
  const [treatyBenefit, setTreatyBenefit] = useState(false);
  const [certified, setCertified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isUS = US_COUNTRIES.includes(country);
  const formType = isUS ? "W-9" : "W-8BEN";
  const hasTreaty = !isUS && TREATY_COUNTRIES.has(country);
  const withholdingRate = treatyBenefit && hasTreaty ? 0.05 : isUS ? 0 : 0.3;

  // Pre-fill from existing record
  useEffect(() => {
    if (existingTaxInfo && !formData.taxSaved) {
      setCountry(existingTaxInfo.country ?? "");
      setLegalName(existingTaxInfo.legalName ?? "");
      setAddress(existingTaxInfo.address ?? "");
      setCity(existingTaxInfo.city ?? "");
      setPostalCode(existingTaxInfo.postalCode ?? "");
      setTreatyBenefit(existingTaxInfo.treatyBenefit ?? false);
      setSaved(true);
    }
  }, [existingTaxInfo]);

  const isComplete =
    country &&
    legalName.trim() &&
    (taxId.trim() || (saved && existingTaxInfo)) &&
    address.trim() &&
    city.trim() &&
    postalCode.trim() &&
    certified;

  const handleSave = useCallback(async () => {
    if (!isComplete || saving) return;
    setError("");
    setSaving(true);

    try {
      await saveTaxInfo({
        userId,
        formType,
        country,
        taxId: taxId.trim() || "UNCHANGED",
        legalName: legalName.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        treatyBenefit,
        treatyCountry: treatyBenefit ? country : undefined,
        withholdingRate,
      });

      setSaved(true);
      updateFormData({
        taxSaved: true,
        taxCountry: country,
        taxLegalName: legalName,
        taxAddress: address,
        taxCity: city,
        taxPostalCode: postalCode,
        taxFormType: formType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tax information.");
    } finally {
      setSaving(false);
    }
  }, [isComplete, saving, userId, formType, country, taxId, legalName, address, city, postalCode, treatyBenefit, withholdingRate, saveTaxInfo, updateFormData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Tax Information
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Required by Shothik AI Ltd (UK) to comply with tax regulations and distribute
          royalties. Your information is encrypted and never shared with third parties.
        </p>
      </div>

      {/* Form type banner */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border",
          isUS
            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30"
            : "bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/30"
        )}
      >
        <FileText
          className={cn(
            "h-5 w-5 mt-0.5 shrink-0",
            isUS ? "text-blue-500" : "text-violet-500"
          )}
        />
        <div>
          <p
            className={cn(
              "font-bold text-sm",
              isUS ? "text-blue-700 dark:text-blue-400" : "text-violet-700 dark:text-violet-400"
            )}
          >
            {country
              ? `You will complete IRS Form ${formType}`
              : "Select your country to determine your tax form"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isUS
              ? "W-9 for US taxpayers — certifies your SSN or EIN for US royalty payments"
              : country
              ? `W-8BEN for non-US residents — certifies foreign status. Withholding rate: ${(withholdingRate * 100).toFixed(0)}%`
              : "W-8BEN (non-US) or W-9 (US) will be required before first payout"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Country of Tax Residence <span className="text-red-500">*</span>
          </label>
          <SelectWrapper
            className={SELECT_CLASS}
            value={country}
            onChange={(e) => { setCountry(e.target.value); setSaved(false); }}
          >
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </SelectWrapper>
        </div>

        {/* Legal name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Legal Name (as on ID / passport) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Full legal name"
            autoComplete="name"
          />
        </div>

        {/* Tax ID */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            {isUS ? "SSN / EIN" : "Foreign Tax Identification Number"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder={
              saved && existingTaxInfo
                ? "••••••••• (on file — enter new value to update)"
                : isUS
                ? "XXX-XX-XXXX or XX-XXXXXXX"
                : "Tax identification number from your country"
            }
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-zinc-400 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Encrypted before storage. Never visible to platform staff.
          </p>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Permanent Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            autoComplete="street-address"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Postal / ZIP code"
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* Treaty benefit (non-US only) */}
      {hasTreaty && !isUS && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={treatyBenefit}
              onChange={(e) => setTreatyBenefit(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand accent-brand"
            />
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Claim US tax treaty benefit
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {COUNTRIES.find((c) => c.code === country)?.name} has a tax treaty with the US.
                Checking this reduces withholding from 30% to 5% on royalties.
                You certify that you meet all treaty requirements under Article 12.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Withholding summary */}
      {country && (
        <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-sm">
          <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-400">
            Estimated withholding rate:{" "}
            <strong className="text-zinc-900 dark:text-white">
              {(withholdingRate * 100).toFixed(0)}%
            </strong>
            {" "}— Shothik AI Ltd will remit this to the IRS on your behalf.
          </span>
        </div>
      )}

      {/* Certification */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => { setCertified(e.target.checked); setSaved(false); }}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand accent-brand"
          />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              Certification under penalty of perjury
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              I certify, under penalty of perjury under the laws of the United States of
              America, that the information provided is true, correct, and complete. I
              authorise Shothik AI Ltd to submit this information to the IRS as required.
            </p>
          </div>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!isComplete || saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
          isComplete && !saving
            ? "bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/20"
            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
        )}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving securely...
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Tax information saved — click to update
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Save tax information securely
          </>
        )}
      </button>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          Tax information on file. You can proceed to Review & Submit.
        </div>
      )}

      <div className="flex items-start gap-2 text-[10px] text-zinc-400">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          This information is required by HMRC and IRS regulations for royalty payments.
          Shothik AI Ltd is registered in England & Wales (Company No. to follow). Your
          data is processed under our Privacy Policy and GDPR Article 6(1)(b).
        </span>
      </div>
    </div>
  );
}
