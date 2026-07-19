const HUAHUA_CALLOUT_LABEL = /\*\*(?:花花的一句話|花花的工程提醒|花花的判斷|Huahua in one sentence|Huahua[’']s engineering note|Huahua[’']s take)\*\*/;

/** Detect the Markdown labels transformed by remarkHuahuaCallout. */
export function hasHuahuaCallout(body: string): boolean {
  return HUAHUA_CALLOUT_LABEL.test(body);
}
