// Pure mapping shared by redirect generation and tests. Old unprefixed routes were Chinese.
export function legacyTarget(pathname, siteUrl) {
 const parts=pathname.replace(/\.html$/,'').split('/').filter(Boolean);
 const lang=['my','zh','en'].includes(parts[0])?parts.shift():'zh';
 const pages=['match','universities','destinations','scholarships'];
 const page=pages.includes(parts[0])?parts[0]+'/':'';
 return new URL(lang+'/'+page,siteUrl).href;
}
