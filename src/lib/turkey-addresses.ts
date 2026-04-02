import rawProvinces from "./turkey-provinces-districts.json";

type RawDistrict = {
  id: number;
  name: string;
};

type RawProvince = {
  id: number;
  name: string;
  districts: RawDistrict[];
};

type ProvinceOption = {
  city: string;
  cityKey: string;
  districts: string[];
  districtLookup: Map<string, string>;
};

const TURKISH_ASCII_MAP: Record<string, string> = {
  c: "c",
  C: "c",
  g: "g",
  G: "g",
  i: "i",
  I: "i",
  o: "o",
  O: "o",
  s: "s",
  S: "s",
  u: "u",
  U: "u",
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

const hasMojibake = (value: string) => /[ÃÄÅ]/.test(value);

const decodeMojibake = (value: string) => {
  if (!hasMojibake(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
};

const toTitleCase = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|[\s\-/(])(\p{L})/gu, (segment, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("tr-TR")}`);

const formatLocationName = (value: string) => toTitleCase(decodeMojibake(value).trim());

const normalizeLocationKey = (value: string) =>
  decodeMojibake(value)
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((character) => TURKISH_ASCII_MAP[character] ?? character.toLocaleLowerCase("tr-TR"))
    .join("")
    .replace(/[^a-z0-9]/g, "");

const provinceOptions: ProvinceOption[] = (rawProvinces as RawProvince[])
  .map((province) => {
    const city = formatLocationName(province.name);
    const districts = province.districts
      .map((district) => formatLocationName(district.name))
      .sort((left, right) => left.localeCompare(right, "tr"));

    return {
      city,
      cityKey: normalizeLocationKey(city),
      districts,
      districtLookup: new Map(districts.map((district) => [normalizeLocationKey(district), district])),
    };
  })
  .sort((left, right) => left.city.localeCompare(right.city, "tr"));

const cityLookup = new Map(provinceOptions.map((province) => [province.cityKey, province]));

export const turkeyCities = provinceOptions.map((province) => province.city);

export const getDistrictsByCity = (city: string) => cityLookup.get(normalizeLocationKey(city))?.districts ?? [];

export const findCanonicalCity = (city: string) => cityLookup.get(normalizeLocationKey(city))?.city ?? city.trim();

export const findCanonicalDistrict = (city: string, district: string) => {
  const province = cityLookup.get(normalizeLocationKey(city));

  if (!province) {
    return district.trim();
  }

  return province.districtLookup.get(normalizeLocationKey(district)) ?? district.trim();
};

export const isDistrictInCity = (city: string, district: string) => {
  const province = cityLookup.get(normalizeLocationKey(city));

  if (!province) {
    return false;
  }

  return province.districtLookup.has(normalizeLocationKey(district));
};
