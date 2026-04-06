export type CountryCodeItem = {
    country: string;
    code: string;
    iso: string;
};

export type PhoneCodeOption = CountryCodeItem & {
    dialCode: string;
    flag: string;
};

export function isoToFlag(iso: string): string {
    return iso
        .toUpperCase()
        .replace(/./g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
}

export function buildPhoneCodeOptions(items: CountryCodeItem[]): PhoneCodeOption[] {
    return [...items]
        .map((item) => ({
            ...item,
            dialCode: `+${item.code}`,
            flag: isoToFlag(item.iso),
        }))
        .sort((a, b) => a.country.localeCompare(b.country));
}